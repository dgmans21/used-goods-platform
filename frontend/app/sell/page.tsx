"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { ImagePlus, Link2, Lock, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

type Errors = {
  image?: string
  name?: string
  price?: string
  description?: string
}

export default function SellPage() {
  const router = useRouter()
  const { currentUser, addProduct } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<"upload" | "url">("upload")
  const [preview, setPreview] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Errors>({})

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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.")
      return
    }
    setPreview(URL.createObjectURL(file))
  }

  const currentImage = mode === "upload" ? preview : imageUrl

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!currentImage) next.image = "상품 이미지를 등록해 주세요."
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

    const created = addProduct({
      image: currentImage,
      name: name.trim(),
      price: priceNum,
      description: description.trim(),
    })
    if (created) {
      toast.success("상품이 등록되었습니다.")
      router.push(`/products/${created.id}`)
    }
  }

  return (
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
                    if (v) setMode(v)
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
                    />
                    {preview ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                        <Image
                          src={preview || "/placeholder.svg"}
                          alt="상품 미리보기"
                          fill
                          className="object-contain"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          className="absolute top-2 right-2"
                          onClick={() => setPreview("")}
                          aria-label="이미지 삭제"
                        >
                          <X />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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

              <Button type="submit" size="lg" className="w-full">
                상품 등록하기
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
