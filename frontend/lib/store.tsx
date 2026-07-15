"use client"

import { create } from "zustand"

import type { Application, Product } from "@/lib/types"
import { useAuthStore } from "@/store/authStore"
import type { User } from "@/types/user"

type AddProductInput = {
  image: string
  name: string
  price: number
  description: string
}

type MarketState = {
  products: Product[]
  applications: Application[]
  addProduct: (input: AddProductInput) => Product | null
  applyProduct: (productId: number) => { ok: boolean; message: string }
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    image: "/products/earphones.png",
    name: "무선 노이즈캔슬링 이어폰",
    sellerId: 2,
    sellerNickname: "민준상점",
    price: 89000,
    description:
      "작년에 구매한 무선 이어폰입니다. 노이즈캔슬링 성능이 뛰어나고 배터리도 오래갑니다. 케이스에 약간의 생활기스가 있으나 사용에는 전혀 문제 없습니다. 정품 케이스와 충전 케이블 함께 드립니다.",
    createdAt: "2026-07-10",
  },
  {
    id: 2,
    image: "/products/camping-chair.png",
    name: "접이식 캠핑 의자",
    sellerId: 1,
    sellerNickname: "하나마켓",
    price: 32000,
    description:
      "두 번 사용한 접이식 캠핑 의자입니다. 튼튼한 프레임에 편안한 착석감이 특징이에요. 접으면 부피가 작아 보관과 이동이 편리합니다. 전용 파우치 포함입니다.",
    createdAt: "2026-07-09",
  },
  {
    id: 3,
    image: "/products/bookshelf.png",
    name: "원목 4단 책장",
    sellerId: 2,
    sellerNickname: "민준상점",
    price: 55000,
    description:
      "이사로 인해 판매합니다. 원목 소재의 4단 책장으로 튼튼하고 수납공간이 넉넉합니다. 눈에 띄는 흠집 없이 상태 좋습니다. 직거래 선호하며 수성구 인근 배송 가능합니다.",
    createdAt: "2026-07-08",
  },
  {
    id: 4,
    image: "/products/air-purifier.png",
    name: "미니 공기청정기",
    sellerId: 1,
    sellerNickname: "하나마켓",
    price: 45000,
    description:
      "책상 위나 작은 방에 딱 좋은 미니 공기청정기입니다. 조용한 소음으로 취침 시에도 부담 없습니다. 새 필터 1개 추가로 드립니다.",
    createdAt: "2026-07-07",
  },
  {
    id: 5,
    image: "/products/road-bike.png",
    name: "입문용 로드 자전거",
    sellerId: 2,
    sellerNickname: "민준상점",
    price: 210000,
    description:
      "입문용으로 좋은 로드 자전거입니다. 가벼운 프레임으로 출퇴근과 라이딩 모두 적합합니다. 최근 체인과 타이어를 새로 교체했습니다. 직접 보고 결정하실 수 있습니다.",
    createdAt: "2026-07-06",
  },
  {
    id: 6,
    image: "/products/floor-lamp.png",
    name: "모던 스탠드 조명",
    sellerId: 1,
    sellerNickname: "하나마켓",
    price: 38000,
    description:
      "거실이나 침실 분위기를 살려주는 모던 스탠드 조명입니다. 따뜻한 색온도로 아늑한 공간을 연출합니다. 전구 포함이며 작동 이상 없습니다.",
    createdAt: "2026-07-05",
  },
]

export const useStore = create<MarketState>()((set, get) => ({
  products: INITIAL_PRODUCTS,
  applications: [],

  addProduct(input) {
    const currentUser = useAuthStore.getState().currentUser
    if (!currentUser) return null

    const { products } = get()
    const newProduct: Product = {
      id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      image: input.image || "/placeholder.svg",
      name: input.name,
      sellerId: currentUser.id,
      sellerNickname: currentUser.nickname,
      price: input.price,
      description: input.description,
      createdAt: new Date().toISOString().slice(0, 10),
    }

    set({ products: [newProduct, ...products] })
    return newProduct
  },

  applyProduct(productId) {
    const currentUser = useAuthStore.getState().currentUser
    const { products, applications } = get()

    if (!currentUser) {
      return { ok: false, message: "로그인이 필요합니다." }
    }

    const product = products.find((p) => p.id === productId)
    if (!product) {
      return { ok: false, message: "상품을 찾을 수 없습니다." }
    }

    if (product.sellerId === currentUser.id) {
      return { ok: false, message: "본인이 등록한 상품입니다." }
    }

    if (currentUser.point < product.price) {
      return { ok: false, message: "포인트가 부족합니다." }
    }

    const updatedUser: User = {
      ...currentUser,
      point: currentUser.point - product.price,
    }

    useAuthStore.getState().setCurrentUser(updatedUser)

    set({
      applications: [
        {
          id: applications.length + 1,
          productId: product.id,
          productName: product.name,
          price: product.price,
          appliedAt: new Date().toISOString().slice(0, 10),
        },
        ...applications,
      ],
    })

    return { ok: true, message: "신청 완료" }
  },
}))

export function formatPoints(value: number | undefined | null) {
  const safeValue = value ?? 0
  return `${safeValue.toLocaleString("ko-KR")}P`
}
