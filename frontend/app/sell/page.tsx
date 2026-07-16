"use client"


import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ImagePlus, Link2, Lock, Upload, X } from "lucide-react"
import { toast } from "sonner"
import axios from "axios" // 👈 백엔드 연동용 axios 임포트 추가

// 브라우저 이미지 압축 라이브러리 임포트
import imageCompression from "browser-image-compression"

import { useStore } from "@/lib/store"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// 유효성 검사 에러 객체 타입 정의
type Errors = {
  image?: string
  name?: string
  price?: string
  description?: string
}

export default function SellPage() {
  const router = useRouter()
  const currentUser = useAuthStore((s) => s.currentUser)
  const addProduct = useStore((s) => s.addProduct) // 필요 시 유지 (현재는 백엔드 전송)
  const fileRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<"upload" | "url">("upload")
  const [preview, setPreview] = useState("") 
  const [imageUrl, setImageUrl] = useState("") 
  const [isUploading, setIsUploading] = useState(false) 
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get("edit") === "true"
  const productId = searchParams.get("id")

  // 미로그인 상태 가드 락 체킹
  if (!currentUser) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent">
          <Lock className="size-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold">로그인이 필요합니다</h1>
        <p className="text-sm text-muted-foreground">
          상품을 등록하려면 먼저 로그인해 주세요.
        </p>
        <Button nativeButton={false} render={<Link href="/login" />}>
          로그인하러 가기
        </Button>
      </main>
    )
  }

  // 파일 선택 시 [압축] 후 [시간 기반 파일명 가공] 및 [Firebase Storage 바로 업로드] 실행
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.")
      return
    }

    try {
      setIsUploading(true)
      setErrors((prev) => ({ ...prev, image: undefined }))

      // 1. 이미지 압축 옵션 설정
      const options = {
        maxSizeMB: 0.3,          // 최대 용량을 300KB 이하로 제한
        maxWidthOrHeight: 1280,  // 가로세로 최대 해상도를 1280px로 제한
        useWebWorker: true,      // 별도 스레드에서 처리하여 UI 버벅임 방지
      }

      // 2. 브라우저에서 원본 파일 압축 진행
      const compressedFile = await imageCompression(file, options)

      // 3. 압축된 파일로 미리보기(Blob URL) 생성 및 화면 표시
      const objectUrl = URL.createObjectURL(compressedFile)
      setPreview(objectUrl)

      // 4. 업로드 시간 기준으로 파일명 가공
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const formattedTimestamp = `${year}-${month}-${date}_${hours}${minutes}${seconds}`;
      const customFileName = `${formattedTimestamp}_${file.name}`;

      // 5. Firebase Storage 저장 경로 지정 (가공된 파일명 적용)
      const storageRef = ref(storage, `products/${customFileName}`)
      const snapshot = await uploadBytes(storageRef, compressedFile)
      
      // 6. 최종 다운로드 URL 추출 및 할당
      const downloadUrl = await getDownloadURL(snapshot.ref)
      setImageUrl(downloadUrl)

      toast.success("이미지가 성공적으로 최적화되어 업로드되었습니다.")
    } catch (error) {
      console.error("Image compression/upload error:", error)
      toast.error("이미지 처리 중 오류가 발생했습니다.")
      setPreview("") 
    } finally {
      setIsUploading(false)
    }
  }

  const currentImage = imageUrl // 업로드든 URL 입력이든 최종 주소는 imageUrl 하나로 통일

  useEffect(() => {
    if (isEditMode && productId) {
      axios.get(`http://localhost:5000/api/products/${productId}`)
        .then(({ data }) => {
          setName(data.name)
          setPrice(data.price.toString())
          setDescription(data.description || "")
          
          // 🔥 불러온 이미지 주소 세팅
          setImageUrl(data.image_url || "")
          
          if (data.image_url) {
            setPreview(data.image_url) // 이미지 미리보기 활성화
            
            // 만약 HTTP 주소 형식이라면 모드를 맞게 변환
            if (data.image_url.startsWith("http")) {
              setMode("url")
            } else {
              setMode("upload")
            }
          }
        })
        .catch((err) => {
          console.error(err)
          toast.error("기존 상품 정보를 불러오는데 실패했습니다.")
        })
    }
  }, [isEditMode, productId])
  function handleClearImage() {
    setPreview("")
    setImageUrl("")
    // 만약 currentImage 상태가 별도로 존재한다면 함께 비워줍니다.
    if (typeof setImageUrl === "function") {
      setImageUrl("")
    }
    if (fileRef.current) fileRef.current.value = ""
  }
  

  // 🚀최종 폼 데이터 전송 (Express 연동 완료)
 // 🚀최종 폼 데이터 전송 (Express 등록/수정 완벽 대응)
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  if (isUploading) {
    toast.error("이미지 업로드가 진행 중입니다. 잠시만 기다려 주세요.")
    return
  }

  // 💡 상태 변수 체크 (imageUrl과 currentImage 중 실제 폼에 채워진 변수 사용)
  const targetImage = imageUrl || currentImage

  const next: Errors = {}
  if (!targetImage) next.image = "상품 이미지를 등록해 주세요."
  if (name.trim().length < 2) next.name = "상품명을 2자 이상 입력해 주세요."
  
  const priceNum = Number(price)
  if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
    next.price = "올바른 가격(포인트)을 입력해 주세요."
  }
  if (description.trim().length < 10) {
    next.description = "상세설명을 10자 이상 입력해 주세요."
  }
  setErrors(next)
  if (Object.keys(next).length > 0) return

  const payload = {
    name: name.trim(),
    price: priceNum,
    description: description.trim(),
    image_url: targetImage,       
    seller_id: Number(currentUser?.id as number) 
  }

  try {
    if (isEditMode && productId) {
      // ✏️ [수정모드] PUT http://localhost:5000/api/products/:id 호출
      const response = await axios.put(`http://localhost:5000/api/products/${productId}`, payload)
      
      if (response.status === 200) {
        toast.success("상품이 성공적으로 수정되었습니다.")
        router.push(`/products/${productId}`)
        router.refresh()
      }
    } else {
      // 🚀 [등록모드] POST http://localhost:5000/api/products 호출
      const response = await axios.post("http://localhost:5000/api/products", payload)
      
      if (response.status === 201 && response.data) {
        toast.success("상품이 등록되었습니다.")
        router.push(`/products/${response.data.id}`)
      }
    }
  } catch (error) {
    console.error("Express 서버 통신 실패:", error)
    toast.error("서버 통신 중 오류가 발생했습니다. 다시 시도해 주세요.")
  }
}

  return (
    // 👈 잘려있던 상단 레이아웃 메인 루트 복구 완료
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">상품 등록</h1>
        <p className="text-sm text-muted-foreground">
          판매할 중고 상품의 정보를 입력해 주세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">판매자 정보</CardTitle>
          <CardDescription>
            {currentUser.nickname} 님으로 등록됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={!!errors.image}>
                <FieldLabel>상품 이미지</FieldLabel>
                <ToggleGroup
                  value={[mode]}
                  onValueChange={(value) => {
                    const v = value[0] as "upload" | "url" | undefined
                    if (v) {
                      setMode(v)
                      handleClearImage()
                    }
                  }}
                  variant="outline"
                >
                  <ToggleGroupItem value="upload">
                    <Upload data-icon="inline-start" />
                    파일 업로드
                  </ToggleGroupItem>
                  <ToggleGroupItem value="url">
                    <Link2 data-icon="inline-start" />
                    이미지 URL
                  </ToggleGroupItem>
                </ToggleGroup>

                {mode === "upload" ? (
                  <div className="mt-1">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFile}
                      disabled={isUploading}
                    />
                    {preview ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                        <Image
                          src={preview}
                          alt="상품 미리보기"
                          fill
                          className="object-contain"
                          unoptimized={preview.startsWith("blob:")}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          className="absolute top-2 right-2"
                          onClick={handleClearImage}
                          aria-label="이미지 삭제"
                          disabled={isUploading}
                        >
                          <X />
                        </Button>
                        {isUploading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-[1px]">
                            <span className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
                            <span className="text-xs font-medium text-foreground">이미지 압축 및 업로드 중...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={isUploading}
                        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                      >
                        <ImagePlus className="size-6" />
                        <span className="text-sm">
                          클릭하여 이미지를 업로드하세요
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 flex flex-col gap-3">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    {imageUrl && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                        <Image
                          src={imageUrl || "/placeholder.svg"}
                          alt="상품 미리보기"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
                <FieldError>{errors.image}</FieldError>
              </Field>

              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">상품명</FieldLabel>
                <Input
                  id="name"
                  placeholder="예) 무선 이어폰"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field data-invalid={!!errors.price}>
                <FieldLabel htmlFor="price">가격 (포인트)</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="예) 50000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-invalid={!!errors.price}
                />
                <FieldDescription>
                  포인트 단위로 입력해 주세요. (1P = 1원 상당)
                </FieldDescription>
                <FieldError>{errors.price}</FieldError>
              </Field>

              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="description">상세설명</FieldLabel>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="상품 상태, 구매 시기, 거래 방법 등을 자세히 적어주세요."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-invalid={!!errors.description}
                />
                <FieldError>{errors.description}</FieldError>
              </Field>

              <Button type="submit" size="lg" className="w-full" disabled={isUploading}>
                상품 등록하기
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}