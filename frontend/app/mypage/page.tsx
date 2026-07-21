"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"
import {
  Coins,
  MapPin,
  Package,
  Receipt,
  Inbox,
  Check,
  X,
  Loader2,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { formatPoints } from "@/lib/store"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Product } from "@/types/product"
import { Card, CardContent } from "@/components/ui/card"
import { ProductCard } from "@/components/product-card"
import { PointChargeModal } from "@/components/point-charge-modal"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000"

// 📄 공통 숫자 페이지네이션 컴포넌트
function NumberPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  // 페이지 번호 배열 생성 (1~10 단위 범위)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-1 py-3 border-t bg-muted/10">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "ghost"}
          size="sm"
          className="size-8 text-xs font-medium"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

export default function MyPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const updatePoint = useAuthStore((s) => s.updatePoint)

  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [applications, setApplications] = useState<any[]>([]) // 내가 보낸 신청
  const [receivedOrders, setReceivedOrders] = useState<any[]>([]) // 내가 받은 신청
  const [isLoading, setIsLoading] = useState(true)
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  // 🙈 1. 받은 신청: 숨김 ID 목록 & 페이지 번호 (페이지당 5개)
  const [hiddenReceivedIds, setHiddenReceivedIds] = useState<number[]>([])
  const [pageReceived, setPageReceived] = useState(1)
  const RECEIVED_PER_PAGE = 5

  // 🙈 2. 등록한 상품: 숨김 ID 목록 & 페이지 번호 (페이지당 6개)
  const [hiddenProductIds, setHiddenProductIds] = useState<number[]>([])
  const [pageProducts, setPageProducts] = useState(1)
  const PRODUCTS_PER_PAGE = 6

  // 🙈 3. 보낸 신청: 숨김 ID 목록 & 페이지 번호 (페이지당 5개)
  const [hiddenAppIds, setHiddenAppIds] = useState<number[]>([])
  const [pageApps, setPageApps] = useState(1)
  const APPS_PER_PAGE = 5

  const point = currentUser?.point ?? 0

  // 🔄 데이터 불러오기
  const fetchReceivedApplications = async () => {
    if (!currentUser?.id) return
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/applications/received?seller_id=${currentUser.id}`
      )
      if (data.success) {
        const rawOrders = data.orders ?? []
        const sortedOrders = [...rawOrders].sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime()
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime()
          if (dateA !== dateB) return dateB - dateA
          return (b.id ?? 0) - (a.id ?? 0)
        })
        setReceivedOrders(sortedOrders)
      }
    } catch (error) {
      console.error("받은 신청 목록 로드 실패:", error)
    }
  }

  useEffect(() => {
    if (!currentUser?.id) return

    async function fetchMyPageData() {
      setIsLoading(true)
      try {
        const [productsRes, appsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/products?seller_id=${currentUser?.id}`),
          axios.get(`${API_BASE}/api/applications?buyer_id=${currentUser?.id}`),
        ])

        setMyProducts(productsRes.data || [])
        setApplications(appsRes.data || [])
        await fetchReceivedApplications()
      } catch (error) {
        console.error("마이페이지 데이터 패칭 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyPageData()
  }, [currentUser?.id])

  // 승인/거절 처리
  const handleReceivedStatusChange = async (
    orderId: number,
    action: "approve" | "reject"
  ) => {
    try {
      setProcessingId(orderId)
      const { data } = await axios.post(`${API_BASE}/api/applications/handle`, {
        order_id: orderId,
        action: action,
      })

      if (data.success) {
        toast.success(data.message)
        if (action === "approve" && data.newPoint !== undefined) {
          updatePoint(data.newPoint)
        }
        await fetchReceivedApplications()
      } else {
        toast.error(data.message || "처리에 실패했습니다.")
      }
    } catch (error) {
      toast.error("서버 처리 중 오류가 발생했습니다.")
    } finally {
      setProcessingId(null)
    }
  }

  // -------------------------------------------------------------
  // 💡 필터링 및 페이징 계산 영역
  // -------------------------------------------------------------

  // 1. 내가 받은 신청 (숨김 제외 -> 페이징)
  const visibleReceived = receivedOrders.filter(
    (item) => !hiddenReceivedIds.includes(item.id)
  )
  const totalReceivedPages = Math.ceil(visibleReceived.length / RECEIVED_PER_PAGE) || 1
  const paginatedReceived = visibleReceived.slice(
    (pageReceived - 1) * RECEIVED_PER_PAGE,
    pageReceived * RECEIVED_PER_PAGE
  )

  // 2. 내가 등록한 상품 (숨김 제외 -> 페이징)
  const visibleProducts = myProducts.filter(
    (item) => !hiddenProductIds.includes(item.id)
  )
  const totalProductPages = Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE) || 1
  const paginatedProducts = visibleProducts.slice(
    (pageProducts - 1) * PRODUCTS_PER_PAGE,
    pageProducts * PRODUCTS_PER_PAGE
  )

  // 3. 내가 신청한 내역 (숨김 제외 -> 페이징)
  const visibleApps = applications.filter(
    (item) => !hiddenAppIds.includes(item.id)
  )
  const totalAppPages = Math.ceil(visibleApps.length / APPS_PER_PAGE) || 1
  const paginatedApps = visibleApps.slice(
    (pageApps - 1) * APPS_PER_PAGE,
    pageApps * APPS_PER_PAGE
  )

  // 비로그인 / 로딩
  if (!currentUser) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="text-xl font-bold">로그인이 필요합니다</h1>
        <Button nativeButton={false} render={<Link href="/login" />}>
          로그인하러 가기
        </Button>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-32 text-center">
        <span className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-sm text-muted-foreground">정보를 불러오는 중입니다...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">마이페이지</h1>

      {/* 프로필 및 포인트 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="flex items-center gap-4 py-6">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/10 text-xl text-primary">
                {currentUser.nickname?.slice(0, 1) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold">{currentUser.nickname}</p>
              <p className="text-sm text-muted-foreground">{currentUser.user_id}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {currentUser.address} {currentUser.address2}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-primary text-primary-foreground cursor-pointer transition-colors hover:bg-primary/90"
          onClick={() => setIsChargeModalOpen(true)}
        >
          <CardContent className="flex h-full flex-col justify-center gap-1 py-6">
            <span className="flex items-center gap-1.5 text-sm text-primary-foreground/85">
              <Coins className="size-4" /> 보유 포인트 (충전하기)
            </span>
            <p className="text-3xl font-bold">{formatPoints(point)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 📥 1. 내가 받은 구매 신청 섹션 */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="size-5 text-primary" />
            <h2 className="text-lg font-bold">내가 받은 구매 신청</h2>
            <Badge variant="secondary">
              {visibleReceived.filter((o) => o.status === "pending").length}건 대기 중
            </Badge>
          </div>

          {hiddenReceivedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setHiddenReceivedIds([])}
              className="text-xs text-muted-foreground hover:underline"
            >
              숨김 초기화 ({hiddenReceivedIds.length})
            </button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {paginatedReceived.length > 0 ? (
              <ul className="divide-y">
                {paginatedReceived.map((order) => {
                  const isPending = order.status === "pending"
                  const isProcessing = processingId === order.id

                  return (
                    <li
                      key={order.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={order.product?.image_url || "/placeholder.svg"}
                          alt={order.product?.name || "상품 이미지"}
                          className="size-12 rounded-md object-cover bg-muted"
                        />
                        <div>
                          <p className="text-sm font-semibold">{order.product?.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            신청자: <span className="font-medium text-foreground">{order.buyer?.nickname || "이웃"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {isPending ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleReceivedStatusChange(order.id, "reject")}
                              disabled={isProcessing}
                            >
                              <X className="size-3.5 mr-1" /> 거절
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReceivedStatusChange(order.id, "approve")}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="size-3.5 mr-1" /> 승인
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant={order.status === "completed" ? "default" : "outline"}>
                              {order.status === "completed" ? "거래 승인됨" : "거절됨"}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              title="숨기기"
                              onClick={() => setHiddenReceivedIds((prev) => [...prev, order.id])}
                            >
                              <EyeOff className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                내역이 없거나 숨김 처리되었습니다.
              </p>
            )}

            <NumberPagination
              currentPage={pageReceived}
              totalPages={totalReceivedPages}
              onPageChange={setPageReceived}
            />
          </CardContent>
        </Card>
      </section>

      {/* 📦 2. 내가 등록한 상품 섹션 */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            <h2 className="text-lg font-bold">내가 등록한 상품</h2>
            <Badge variant="secondary">{visibleProducts.length}</Badge>
          </div>

          {hiddenProductIds.length > 0 && (
            <button
              type="button"
              onClick={() => setHiddenProductIds([])}
              className="text-xs text-muted-foreground hover:underline"
            >
              숨김 초기화 ({hiddenProductIds.length})
            </button>
          )}
        </div>

        {paginatedProducts.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {paginatedProducts.map((product) => (
                <div key={product.id} className="relative group">
                  <ProductCard
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      description: product.description ?? "",
                      image: product.image_url ?? product.imageUrl ?? "/placeholder.svg",
                      sellerId: product.seller_id ?? product.sellerId ?? 0,
                      sellerNickname: currentUser.nickname,
                      createdAt: product.created_at
                        ? new Date(product.created_at).toLocaleDateString()
                        : "",
                      status: product.status ?? "sale",
                    } as Product}
                  />
                  {/* 카드 우상단 숨기기 버튼 */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 size-7 rounded-full opacity-80 hover:opacity-100 shadow-md z-10"
                    title="상품 숨기기"
                    onClick={() => setHiddenProductIds((prev) => [...prev, product.id])}
                  >
                    <EyeOff className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <NumberPagination
              currentPage={pageProducts}
              totalPages={totalProductPages}
              onPageChange={setPageProducts}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">
              등록한 상품이 없거나 모두 숨김 처리되었습니다.
            </p>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/sell" />}>
              상품 등록하기
            </Button>
          </div>
        )}
      </section>

      {/* 🧾 3. 내가 신청한 내역 섹션 */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-primary" />
            <h2 className="text-lg font-bold">내가 신청한 내역</h2>
            <Badge variant="secondary">{visibleApps.length}</Badge>
          </div>

          {hiddenAppIds.length > 0 && (
            <button
              type="button"
              onClick={() => setHiddenAppIds([])}
              className="text-xs text-muted-foreground hover:underline"
            >
              숨김 초기화 ({hiddenAppIds.length})
            </button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {paginatedApps.length > 0 ? (
              <>
                <ul className="divide-y">
                  {paginatedApps.map((app) => (
                    <li key={app.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{app.productName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(app.appliedAt).toLocaleDateString()} 신청
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-primary">
                          -{formatPoints(app.price)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="내역 숨기기"
                          onClick={() => setHiddenAppIds((prev) => [...prev, app.id])}
                        >
                          <EyeOff className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>

                <NumberPagination
                  currentPage={pageApps}
                  totalPages={totalAppPages}
                  onPageChange={setPageApps}
                />
              </>
            ) : (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                신청 내역이 없거나 모두 숨김 처리되었습니다.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 포인트 충전 모달 */}
      <PointChargeModal
        isOpen={isChargeModalOpen}
        onClose={() => setIsChargeModalOpen(false)}
      />
    </main>
  )
}