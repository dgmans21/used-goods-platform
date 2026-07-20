"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { Coins, MapPin, Package, Receipt, Inbox, Check, X, Loader2 } from "lucide-react"
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

export default function MyPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const updatePoint = useAuthStore((s) => s.updatePoint)

  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [applications, setApplications] = useState<any[]>([]) // 내가 보낸 신청
  const [receivedOrders, setReceivedOrders] = useState<any[]>([]) // 🚀 내가 받은 신청
  const [isLoading, setIsLoading] = useState(true)
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null) // 승인/거절 로딩 State

  const point = currentUser?.point ?? 0

  // 🔄 1. 받은 신청 목록 불러오기
  const fetchReceivedApplications = async () => {
    if (!currentUser?.id) return
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/applications/received?seller_id=${currentUser.id}`
      )
      if (data.success) {
        setReceivedOrders(data.orders ?? [])
      }
    } catch (error) {
      console.error("받은 신청 목록 로드 실패:", error)
    }
  }

  // 🔄 2. 백엔드 통합 데이터 패칭
  useEffect(() => {
    if (!currentUser?.id) return

    async function fetchMyPageData() {
      setIsLoading(true)
      try {
        const [productsRes, appsRes, receivedRes] = await Promise.all([
          axios.get(`${API_BASE}/api/products?seller_id=${currentUser?.id}`),
          axios.get(`${API_BASE}/api/applications?buyer_id=${currentUser?.id}`),
          axios.get(`${API_BASE}/api/applications/received?seller_id=${currentUser?.id}`),
        ])

        setMyProducts(productsRes.data || [])
        setApplications(appsRes.data || [])
        if (receivedRes.data?.success) {
          setReceivedOrders(receivedRes.data.orders || [])
        }
      } catch (error) {
        console.error("마이페이지 데이터를 가져오는 중 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyPageData()
  }, [currentUser?.id])

  // 🚀 3. 받은 신청 승인 / 거절 처리 핸들러
  const handleReceivedStatusChange = async (orderId: number, action: "approve" | "reject") => {
    try {
      setProcessingId(orderId)
      const { data } = await axios.post(`${API_BASE}/api/applications/handle`, {
        order_id: orderId,
        action: action,
      })

      if (data.success) {
        toast.success(data.message)
        
        // 승인 시 백엔드에서 반환된 갱신 포인트가 있는 경우 즉시 반영
        if (action === "approve" && data.newPoint !== undefined) {
          updatePoint(data.newPoint)
        }

        // 목록 리프레시
        fetchReceivedApplications()
      } else {
        toast.error(data.message || "처리에 실패했습니다.")
      }
    } catch (error) {
      toast.error("서버 처리 중 오류가 발생했습니다.")
    } finally {
      setProcessingId(null)
    }
  }

  // 비로그인 처리
  if (!currentUser) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="text-xl font-bold">로그인이 필요합니다</h1>
        <p className="text-sm text-muted-foreground">
          마이페이지는 로그인 후 이용할 수 있습니다.
        </p>
        <Button nativeButton={false} render={<Link href="/login" />}>
          로그인하러 가기
        </Button>
      </main>
    )
  }

  // 로딩 상태 뷰
  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-32 text-center">
        <span className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-sm text-muted-foreground">마이페이지 정보를 불러오는 중입니다...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">마이페이지</h1>

      {/* 유저 프로필 및 포인트 영역 */}
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

        {/* 포인트 카드 */}
        <Card
          className="bg-primary text-primary-foreground cursor-pointer transition-colors hover:bg-primary/90"
          onClick={() => setIsChargeModalOpen(true)}
        >
          <CardContent className="flex h-full flex-col justify-center gap-1 py-6">
            <span className="flex items-center gap-1.5 text-sm text-primary-foreground/85">
              <Coins className="size-4" />
              보유 포인트 (클릭하여 충전)
            </span>
            <p className="text-3xl font-bold">{formatPoints(point)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 📥 1. 내가 받은 신청 섹션 (신규 추가!) */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Inbox className="size-5 text-primary" />
          <h2 className="text-lg font-bold">내가 받은 구매 신청</h2>
          <Badge variant="secondary">
            {receivedOrders.filter((o) => o.status === "pending").length}건 대기 중
          </Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            {receivedOrders.length > 0 ? (
              <ul className="divide-y">
                {receivedOrders.map((order) => {
                  const isPending = order.status === "pending"
                  const isProcessing = processingId === order.id

                  return (
                    <li key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
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
                          <Badge variant={order.status === "completed" ? "default" : "outline"}>
                            {order.status === "completed" ? "거래 승인됨" : "거절됨"}
                          </Badge>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                아직 들어온 구매 신청이 없어요.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 📦 2. 내가 등록한 상품 섹션 */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Package className="size-5 text-primary" />
          <h2 className="text-lg font-bold">내가 등록한 상품</h2>
          <Badge variant="secondary">{myProducts.length}</Badge>
        </div>

        {myProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {myProducts.map((product) => (
              <ProductCard
                key={product.id}
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
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">아직 등록한 상품이 없어요.</p>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/sell" />}>
              상품 등록하기
            </Button>
          </div>
        )}
      </section>

      {/* 🧾 3. 내가 보낸 신청 내역 섹션 */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="size-5 text-primary" />
          <h2 className="text-lg font-bold">내가 신청한 내역</h2>
          <Badge variant="secondary">{applications.length}</Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            {applications.length > 0 ? (
              <ul>
                {applications.map((app, index) => (
                  <li key={app.id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{app.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.appliedAt).toLocaleDateString()} 신청
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        -{formatPoints(app.price)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                아직 신청한 상품이 없어요.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 포인트 충전 모달 */}
      <PointChargeModal isOpen={isChargeModalOpen} onClose={() => setIsChargeModalOpen(false)} />
    </main>
  )
}