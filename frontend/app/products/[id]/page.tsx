"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertTriangle, ArrowLeft, CheckCircle2, Coins, Loader2 } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

import { formatPoints, useStore } from "@/lib/store"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PointChargeModal } from "@/components/point-charge-modal" // 🚀 충전 모달 import 추가
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// 💡 1. 백엔드와 Mock 데이터를 모두 수용할 수 있는 타입 정의
type Product = {
  id: number
  name: string
  price: number
  description: string
  image_url?: string // 백엔드 필드명
  image?: string     // Mock 필드명
  seller_id?: number // 백엔드 필드명
  sellerId?: number  // Mock 필드명
  sellerNickname: string
  createdAt?: string
}

const API_BASE = "http://localhost:5000"

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { products, applyProduct } = useStore() // 기존 Mock 스토어 기능 유지

  // 💡 2. 로딩 및 상태 관리
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [isChargeOpen, setIsChargeOpen] = useState(false) // 🚀 포인트 충전 모달 상태
  const updatePoint = useAuthStore((s) => s.updatePoint)
  // 💡 3. 데이터 로드 전략: 백엔드 우선 -> 실패 시 Mock 데이터에서 탐색
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        // Express 백엔드 API에서 먼저 조회 시도
        const { data } = await axios.get<Product>(`${API_BASE}/api/products/${params.id}`)
        setProduct(data)
      } catch (error) {
        console.warn("백엔드 상품 조회 실패, 로컬 Mock 데이터를 탐색합니다.")
        
        // 백엔드에 없을 경우, 기존 mock `products` 리스트에서 가져옴
        const mockProduct = products.find((p) => p.id === Number(params.id))
        if (mockProduct) {
          setProduct(mockProduct as Product)
        } else {
          toast.error("상품을 찾을 수 없습니다.")
          router.push("/")
        }
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id, products, router])

  // 로딩 상태 뷰 렌더링 (백엔드 패치 중일 때만 작동)
  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // 예외 안전 가드
  if (!product) return null

  // 💡 4. 백엔드와 Mock의 이중 필드 대응 처리 (백엔드 우선 ?? Mock 예외 처리)
  const sellerId = product.seller_id ?? product.sellerId
  const imageUrl = product.image_url ?? product.image ?? "/placeholder.svg"
  
  const isOwner = currentUser?.id === sellerId
  const points = currentUser?.point ?? 0
  const insufficient = points < product.price
  const remaining = points - product.price

  // 🗑️ 상품 삭제 처리 함수
  async function handleDelete() {
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) return

    try {
      if (product?.seller_id) {
        // 백엔드 삭제 API 호출
        await axios.delete(`${API_BASE}/api/products/${product.id}`)
        toast.success("상품이 정상적으로 삭제되었습니다.")
        router.push("/")
      } else {
        toast.error("로컬 테스트용 데이터는 삭제할 수 없습니다.")
      }
    } catch (error) {
      console.error(error)
      toast.error("상품 삭제 중 오류가 발생했습니다.")
    }
  }

  function handleApplyClick() {
    if (!currentUser) {
      toast.error("로그인이 필요합니다.")
      router.push("/login")
      return
    }
    setDone(false)
    setOpen(true)
  }

  // 💡 5. 구매 신청도 동일하게 Mock과 API 동시 지원
  // 컴포넌트 상단 예시: Zustand 스토어에서 유저 정보 업데이트 함수 가져오기
// const { currentUser, setCurrentUser } = useAuthStore() 

async function handleConfirm() {
  if (!product || !currentUser) return

  try {
    // 💡 백엔드 DB 연동 상품인 경우 (seller_id 존재)
    if (product.seller_id) {
      const response = await axios.post(`${API_BASE}/api/applications`, {
        product_id: product.id,
        buyer_id: currentUser.id, // 현재 로그인한 유저 = 구매자(buyer)
      })

      if (response.status === 200 || response.status === 201) {
        // 🚀 1. 백엔드 처리 성공 시, Zustand의 유저 포인트도 차감해서 반영
        const nextPoint = (currentUser.point ?? 0) - product.price
        updatePoint(nextPoint)
      
        setDone(true)
        toast.success("신청이 완료되었습니다.")
      }
    } else {
      // 로컬 Mock 상품인 경우 기존 로직 유지
      const result = applyProduct(product.id)
      if (result.ok) {
        setDone(true)
        toast.success("신청이 완료되었습니다.")
      } else {
        toast.error(result.message)
      }
    }
  } catch (error: any) {
    console.error("주문/신청 실패:", error)
    const errorMsg = error.response?.data?.message || "신청 처리 중 오류가 발생했습니다."
    toast.error(errorMsg)
  }
}

  const sellerName = product.sellerNickname ?? "판매자"
  const registerDate = product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "최근"

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/" />}
        className="mb-4 text-muted-foreground"
      >
        <ArrowLeft data-icon="inline-start" />
        목록으로
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-balance">{product.name}</h1>
          <p className="mt-3 text-3xl font-bold text-primary">
            {formatPoints(product.price)}
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border p-4">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {sellerName.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{sellerName}</p>
              <p className="text-xs text-muted-foreground">
                판매자 · {registerDate} 등록
              </p>
            </div>
          </div>

          <div>
            <Separator className="my-6" />
            <h2 className="mb-2 text-sm font-semibold">상품 설명</h2>
            <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="mt-8">
            {isOwner ? (
              <div className="flex flex-col gap-2">
                <p className="text-center text-sm font-medium text-muted-foreground">
                  내가 작성한 글입니다
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    nativeButton={false}
                    render={<Link href={`/sell?edit=true&id=${product.id}`} />}
                  >
                    수정하기
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDelete}
                  >
                    삭제하기
                  </Button>
                </div>
              </div>
           ) : (
            <Button 
              size="lg" 
              className="w-full" 
              onClick={handleApplyClick}
              disabled={product.status === "sold_out"}
            >
              <Coins data-icon="inline-start" />
              {product.status === "sold_out" 
                ? "판매 완료된 상품" 
                : product.status === "reserved" 
                ? "거래 협상 중 (신청하기)" 
                : "상품 신청하기"}
            </Button>
          )}
          </div>
        </div>
      </div>

      {/* 🚀 신청 진행 및 완료 모달 */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setDone(false)
        }}
      >
        <DialogContent>
          {done ? (
            /* 1️⃣ 신청 완료 화면 */
            <>
              <DialogHeader>
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="size-6 text-primary" />
                </div>
                <DialogTitle className="text-center text-xl font-bold">
                  신청이 완료되었습니다!
                </DialogTitle>
                <DialogDescription className="text-center text-sm">
                  <span className="font-semibold text-foreground">
                    {product.name}
                  </span>{" "}
                  신청을 마쳤습니다.
                  <br />
                  판매자에게 알림이 전달되었어요.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 rounded-xl border bg-muted/50 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">차감 포인트</span>
                  <span className="font-semibold text-destructive">
                    -{formatPoints(product.price)}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">
                    신청 후 잔액
                  </span>
                  <span className="text-base font-bold text-primary">
                    {formatPoints(currentUser?.point ?? 0)}
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false)
                    setDone(false)
                  }}
                  nativeButton={false}
                  render={<Link href="/mypage" />}
                >
                  마이페이지로
                </Button>

                <Button
                  onClick={() => {
                    setOpen(false)
                    setDone(false)
                  }}
                >
                  확인
                </Button>
              </DialogFooter>
            </>
          ) : (
            /* 2️⃣ 신청 진행 폼 화면 */
            <>
              <DialogHeader>
                <DialogTitle>상품 신청하기</DialogTitle>
                <DialogDescription>
                  보유 포인트를 확인하고 신청을 진행해 주세요.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="relative size-14 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {formatPoints(product.price)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">보유 포인트</span>
                    <span className="font-medium">{formatPoints(points)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">상품 가격</span>
                    <span className="font-medium">
                      -{formatPoints(product.price)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">신청 후 잔액</span>
                    <span
                      className={
                        insufficient
                          ? "font-semibold text-destructive"
                          : "font-semibold text-primary"
                      }
                    >
                      {insufficient ? "부족" : formatPoints(remaining)}
                    </span>
                  </div>
                </div>

                {insufficient && (
                  <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>
                        보유 포인트가 부족합니다. 포인트를 충전한 후 다시 신청해 주세요.
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-1 w-full border-destructive/30 bg-background text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setOpen(false) // 1. 신청 모달 닫기
                        setIsChargeOpen(true) // 2. 충전 모달 켜기
                      }}
                    >
                      <Coins className="mr-1.5 size-4" />
                      포인트 충전하러 가기
                    </Button>
                  </div>
                )}

                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    취소
                  </DialogClose>
                  <Button disabled={insufficient} onClick={handleConfirm}>
                    {formatPoints(product.price)} 신청하기
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 🚀 포인트 충전 모달 컴포넌트 연결 */}
      <PointChargeModal
        isOpen={isChargeOpen}
        onClose={() => setIsChargeOpen(false)}
      />
    </main>
  )
}