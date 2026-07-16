import Link from "next/link"
import Image from "next/image" // 🚀 Next.js 최적화 이미지 컴포넌트 유지

// 🚀 전역 타입을 가져와서 재사용
import { Product } from "@/types/product"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  // 백엔드 데이터 누락에 대비한 안전한 기본값 처리
  const status = product.status ?? "sale"
  const image = product.image_url ?? product.image ?? "/placeholder.svg"
  const sellerNickname = product.sellerNickname ?? "이웃주민"
  const createdAt = product.created_at ?? product.createdAt ?? ""

  // 🎨 상태별 테두리 및 배지 스타일 매핑
  const statusStyles = {
    sale: {
      cardBorder: "border-border hover:border-primary/50",
      badgeClass: "bg-emerald-500 text-white",
      badgeText: "판매중",
      overlay: "", 
    },
    reserved: {
      cardBorder: "border-blue-500 ring-2 ring-blue-500/20",
      badgeClass: "bg-blue-600 text-white animate-pulse",
      badgeText: "거래 진행중",
      overlay: "bg-blue-500/5",
    },
    sold_out: {
      cardBorder: "border-gray-300 opacity-75",
      badgeClass: "bg-gray-600 text-white",
      badgeText: "거래 완료",
      overlay: "bg-black/40 flex items-center justify-center",
    },
  }

  const currentStyle = statusStyles[status as keyof typeof statusStyles] ?? statusStyles.sale

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-xl border-2 bg-background transition-all duration-200 ${currentStyle.cardBorder}`}>
      
      {/* 썸네일 이미지 및 배지 영역 */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {/* Next.js Image 컴포넌트로 성능 최적화 유지 */}
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* 1. 이미지 위에 얹어지는 상태별 레이어 */}
        {status !== "sale" && (
          <div className={`absolute inset-0 z-10 transition-all ${currentStyle.overlay}`}>
            {status === "sold_out" && (
              <span className="text-white font-extrabold text-lg tracking-wider border-2 border-white px-3 py-1 rounded-md rotate-[-10deg] shadow-lg bg-black/20">
                SOLD OUT
              </span>
            )}
          </div>
        )}

        {/* 2. 좌측 상단 실시간 상태 문구 배지 */}
        <div className="absolute top-2 left-2 z-20">
          <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold shadow-md tracking-tight ${currentStyle.badgeClass}`}>
            {currentStyle.badgeText}
          </span>
        </div>
      </div>

      {/* 상품 기본 정보 영역 */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className={`font-semibold line-clamp-1 text-sm sm:text-base ${status === "sold_out" ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {product.name}
        </h3>
        
        <p className={`text-sm font-bold mt-1 ${status === "sold_out" ? "text-muted-foreground" : "text-primary"}`}>
          {product.price.toLocaleString()} P
        </p>

        {/* 하단 정보 (등록일, 판매자 닉네임) */}
        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-dashed mt-4">
          <span className="truncate max-w-[100px]">{sellerNickname}</span>
          <span>{createdAt}</span>
        </div>
      </div>

      {/* 상세페이지 링크 (전체 카드 영역 활성화) */}
      <Link href={`/products/${product.id}`} className="absolute inset-0 z-30">
        <span className="sr-only">{product.name} 상세보기</span>
      </Link>
    </div>
  )
}