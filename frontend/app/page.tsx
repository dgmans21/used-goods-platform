"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Loader2, PlusCircle, Search, ShieldCheck } from "lucide-react"
import axios from "axios"

import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/product-card"

// 💡 React Key 매핑을 위해 고유 key 필드를 추가한 타입 정의
type Product = {
  id: number
  uniqueKey?: string // 🚀 중복 렌더링 방지를 위한 React 전용 고유 키
  name: string
  price: number
  description: string
  image_url?: string
  image?: string
  seller_id?: number
  sellerId?: number
  sellerNickname?: string
  createdAt?: string
}

const API_BASE = "http://localhost:5000"

export default function HomePage() {
  const { products: mockProducts } = useStore()
  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

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

  // 💡 최대 11개 노출 및 고유 키(uniqueKey) 부여 로직 적용
  const mergedProducts = useMemo<Product[]>(() => {
    const uniqueProductsMap = new Map<string, Product>()

    // 1) 기존 Mock 데이터 추가 (uniqueKey 필드 세팅)
    mockProducts.forEach((p) => {
      const key = `mock-${p.id}`
      uniqueProductsMap.set(key, { ...(p as Product), uniqueKey: key })
    })

    // 2) DB 데이터 추가 (uniqueKey 필드 세팅)
    dbProducts.forEach((p) => {
      const key = `db-${p.id}`
      uniqueProductsMap.set(key, { ...p, uniqueKey: key })
    })

    // 3) 뒤집어서 정렬한 뒤 최대 11개까지만 표시
    return Array.from(uniqueProductsMap.values())
      .reverse()
      .slice(0, 11)
  }, [mockProducts, dbProducts])

  const filtered = useMemo<Product[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mergedProducts
    return mergedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    )
  }, [mergedProducts, query])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* ... 상단 히어로 섹션 ... */}
      <section className="mb-8 flex flex-col items-start gap-4 rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
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
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">전체 상품</h2>
          <p className="text-sm text-muted-foreground">
            총 {filtered.length}개의 상품이 등록되어 있어요
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="상품명으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 w-full items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product: Product) => (
            <ProductCard
              // 🚀 리액트 가상돔이 인지할 key 값으로 고유한 'mock-1' 또는 'db-1'을 사용합니다!
              key={product.uniqueKey ?? `product-${product.id}`}
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                description: product.description,
                image: product.image_url ?? product.image ?? "/placeholder.svg",
                sellerId: product.seller_id ?? product.sellerId ?? 0,
                sellerNickname: product.sellerNickname ?? "이웃주민",
                createdAt: product.createdAt ?? "",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <p className="font-medium">검색 결과가 없어요</p>
          <p className="text-sm text-muted-foreground">
            다른 검색어로 다시 시도해 보세요.
          </p>
        </div>
      )}
    </main>
  )
}