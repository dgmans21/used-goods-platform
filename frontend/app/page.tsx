"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Loader2, PlusCircle, Search, ShieldCheck, ChevronLeft, ChevronRight, Coins } from "lucide-react"
import axios from "axios"

import { Heart } from "lucide-react"


import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/product-card"
import { Product } from "@/types/product"

// 🚀 추가: 포인트 모달 및 스토어/인증 관련 임포트
import { useAuthStore } from "@/store/authStore"
import { PointChargeModal } from "@/components/point-charge-modal"

// 검색 타겟 구분 타입
type SearchType = "all" | "title" | "seller"

const API_BASE = "http://localhost:5000"
const ITEMS_PER_PAGE = 20 // 한 페이지당 노출할 상품 수

// 🕒 24시간 기준으로 분기하는 시간 포맷팅 유틸 함수
const formatProductTime = (dateString: string | null | undefined) => {
  if (!dateString) return ""
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  
  const diffInMins = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

  // 1. 24시간 이내인 경우 (상대적 시간 표시)
  if (diffInHours < 24) {
    if (diffInMins < 1) {
      return "방금 전"
    } else if (diffInMins < 60) {
      return `${diffInMins}분 전`
    } else {
      return `${diffInHours}시간 전`
    }
  }

  // 2. 24시간이 지난 경우 (분 단위까지만 절대 시간 표시)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export default function HomePage() {
  const { products: mockProducts } = useStore()
  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchType, setSearchType] = useState<SearchType>("all")

  // 🚀 1. 포인트 및 유저 정보 구독용 전역 상태 가져오기
  const currentUser = useAuthStore((s) => s.currentUser)
  const updatePoint = useAuthStore((s) => s.updatePoint) // 🚀 새로 만든 안전한 액션 가져오기
  
  const point = currentUser?.point ?? 0
  const setPoint = updatePoint

  // 🚀 2. 모달 열림 상태 관리 및 컴포넌트 내부 State
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false)

  // 🚀 3. MyPage와 동일하게 로그인 유저의 기존 포인트를 포인트 전용 스토어에 동기화
  useEffect(() => {
    if (currentUser?.point !== undefined) {
      setPoint(currentUser.point)
    }
  }, [currentUser?.point, setPoint])

  // 1. API를 통해 백엔드 상품 데이터 가져오기
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const { data } = await axios.get<Product[]>(`${API_BASE}/api/products`)
        setDbProducts(data)
      } catch (error) {
        console.warn("백엔드 상품 목록 로드 실패, 로컬 Mock 데이터만 사용합니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // 검색어나 검색 조건이 바뀌면 페이지를 자동으로 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [query, searchType])

  // 💡 DB 최신 데이터를 무조건 맨 앞으로, Mockup 데이터를 맨 뒤로 밀어내는 로직
  const mergedProducts = useMemo<Product[]>(() => {
    // 1. DB 데이터 가공 (이미 백엔드에서 최신순[id: 'desc']으로 정렬되어 옴)
    const dbList = dbProducts.map((p) => {
      const key = `db-${p.id}`
      return { ...p, uniqueKey: key }
    })

    // 2. Mock 데이터 가공
    const mockList = mockProducts.map((p) => {
      const key = `mock-${p.id}`
      return { ...(p as Product), uniqueKey: key }
    })

    // 3. 🚀 DB 리스트를 맨 앞에 두고, Mock 리스트를 그 뒤에 합쳐서(Concat) 반환!
    return [...dbList, ...mockList]
  }, [mockProducts, dbProducts])

  // 3. 상품명/설명 또는 조인된 실제 판매자 닉네임으로 검색 필터링
  const filteredProducts = useMemo<Product[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mergedProducts

    return mergedProducts.filter((p) => {
      const productName = p.name.toLowerCase()
      const productDesc = p.description?.toLowerCase() ?? ""
      const sellerNickname = (p.sellerNickname ?? "이웃주민").toLowerCase()

      if (searchType === "title") {
        return productName.includes(q) || productDesc.includes(q)
      } else if (searchType === "seller") {
        return sellerNickname.includes(q)
      } else {
        return productName.includes(q) || productDesc.includes(q) || sellerNickname.includes(q)
      }
    })
  }, [mergedProducts, query, searchType])

  // 4. 필터링된 결과 중에서 현재 페이지 범위(20개) 데이터만 자르기
  const paginatedProducts = useMemo<Product[]>(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage])

  // 5. 전체 페이지 수 계산
  const totalPages = Math.max(Math.ceil(filteredProducts.length / ITEMS_PER_PAGE), 1)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* 상단 히어로 섹션 */}
      <section className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
        <div className="flex flex-col items-start gap-4 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
            <ShieldCheck className="size-3.5" />
            포인트로 안전하게 거래하는 우리 동네 중고마켓
          </span>
          <h1 className="text-3xl font-bold text-balance sm:text-4xl">
            필요한 물건, 이웃과 나눠요
          </h1>
          <p className="max-w-xl text-sm text-primary-foreground/85 sm:text-base">
            수성마켓에서 믿을 수 있는 이웃과 중고 상품을 사고팔아 보세요. 간편하게
            등록하고 포인트로 신청하면 거래 끝!
          </p>
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href="/sell" />}
            className="mt-2"
          >
            <PlusCircle data-icon="inline-start" />
            상품 등록하기
          </Button>
        </div>

        {/* 🚀 우측 영역: 로그인된 사용자인 경우, 내 보유 포인트를 보여주고 클릭 시 충전 모달이 실행됩니다. */}
        {currentUser && (
          <div 
            onClick={() => setIsChargeModalOpen(true)}
            className="flex flex-col items-start gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/15 border border-primary-foreground/20 rounded-xl p-5 cursor-pointer transition-all w-full md:w-64"
          >
            <div className="flex items-center gap-2">
              <Coins className="size-5 text-yellow-400" />
              <span className="text-sm font-medium text-primary-foreground/90">내 보유 포인트</span>
            </div>
            <span className="text-2xl font-bold">
              {(point ?? 0).toLocaleString()} P
            </span>
            <span className="text-xs text-primary-foreground/75 underline underline-offset-4 mt-1">
              클릭하여 충전하기 &rarr;
            </span>
          </div>
        )}
      </section>

      {/* 필터 및 검색 바 영역 */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold">전체 상품</h2>
          <p className="text-sm text-muted-foreground">
            총 {filteredProducts.length}개의 상품이 등록되어 있어요
          </p>
        </div>

        {/* 탭 스타일 검색 타겟 설정기 + 입력 필드 */}
        <div className="flex flex-col gap-2 w-full sm:max-w-md">
          {/* 세그먼트 탭 필터 (토글 버튼 그룹) */}
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full grid grid-cols-3">
            <button
              onClick={() => setSearchType("all")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                searchType === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setSearchType("title")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                searchType === "title"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              상품명
            </button>
            <button
              onClick={() => setSearchType("seller")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                searchType === "seller"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              판매자
            </button>
          </div>

          {/* 검색창 */}
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                searchType === "all"
                  ? "상품명 또는 판매자명으로 검색"
                  : searchType === "title"
                  ? "상품명으로 검색"
                  : "판매자 닉네임으로 검색"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

   {/* 상품 목록 표시 영역 */}
   {loading ? (
        <div className="flex h-40 w-full items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : paginatedProducts.length > 0 ? (
        <>
          {/* 상품들을 예쁘게 바둑판 배열로 정렬해주는 부모 div 시작 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {paginatedProducts.map((product: any) => {
              // 1. 컴포넌트에 넘겨줄 규격화된 상품 객체 생성
              const formattedProduct = {
                id: product.id,
                name: product.name,
                price: product.price,
                description: product.description ?? "",
                image: product.image_url ?? product.image ?? "/placeholder.svg",
                sellerId: product.seller_id ?? product.sellerId ?? 0,
                sellerNickname: product.sellerNickname ?? "이웃주민",
                createdAt: formatProductTime(product.created_at ?? product.createdAt),
                status: product.status ?? "sale"
              }

              return (
                <ProductCard
                  // 🚀 중복 Key 문제를 해결하기 위해 고유한 uniqueKey를 적용합니다.
                  key={product.uniqueKey ?? `product-${product.id}`} 
                  product={formattedProduct as any} 
                />
              )
            })}
          </div> {/* 👈 부모 grid div를 여기서 깔끔하게 닫아줍니다! */}

          {/* 숫자형 페이지네이션 네비게이션 */}
          <div className="mt-12 flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                className="w-10 h-10 p-0"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <p className="font-medium">검색 결과가 없어요</p>
          <p className="text-sm text-muted-foreground">
            다른 검색어로 다시 시도해 보세요.
          </p>
        </div>
      )}

      {/* 🚀 4. 포인트 충전 모달 컴포넌트 마운트 */}
      <PointChargeModal 
        isOpen={isChargeModalOpen}
        onClose={() => setIsChargeModalOpen(false)}
      />
    </main>
  )
}