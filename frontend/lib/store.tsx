"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Application, Product, User } from "@/lib/types"

const INITIAL_USERS: User[] = [
  {
    idx: 1,
    email: "hana@example.com",
    nickname: "하나마켓",
    points: 120000,
    address: "대구광역시 수성구 달구벌대로",
    addressDetail: "101동 1201호",
  },
  {
    idx: 2,
    email: "minjun@example.com",
    nickname: "민준상점",
    points: 80000,
    address: "대구광역시 수성구 동대구로",
    addressDetail: "202동 803호",
  },
]

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    image: "/products/earphones.png",
    name: "무선 노이즈캔슬링 이어폰",
    sellerIdx: 2,
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
    sellerIdx: 1,
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
    sellerIdx: 2,
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
    sellerIdx: 1,
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
    sellerIdx: 2,
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
    sellerIdx: 1,
    sellerNickname: "하나마켓",
    price: 38000,
    description:
      "거실이나 침실 분위기를 살려주는 모던 스탠드 조명입니다. 따뜻한 색온도로 아늑한 공간을 연출합니다. 전구 포함이며 작동 이상 없습니다.",
    createdAt: "2026-07-05",
  },
]

type SignupInput = {
  email: string
  nickname: string
  address: string
  addressDetail: string
}

type AddProductInput = {
  image: string
  name: string
  price: number
  description: string
}

type StoreContextValue = {
  currentUser: User | null
  users: User[]
  products: Product[]
  applications: Application[]
  login: (email: string) => boolean
  loginWithGoogle: () => void
  signup: (input: SignupInput) => void
  logout: () => void
  addProduct: (input: AddProductInput) => Product | null
  applyProduct: (productId: number) => { ok: boolean; message: string }
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [applications, setApplications] = useState<Application[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0])

  const value = useMemo<StoreContextValue>(() => {
    function login(email: string) {
      const found = users.find((u) => u.email === email)
      if (found) {
        setCurrentUser(found)
        return true
      }
      return false
    }

    function loginWithGoogle() {
      const google: User = {
        idx: 999,
        email: "google.user@gmail.com",
        nickname: "구글사용자",
        points: 50000,
        address: "대구광역시 수성구",
        addressDetail: "",
      }
      setUsers((prev) =>
        prev.some((u) => u.idx === google.idx) ? prev : [...prev, google],
      )
      setCurrentUser(google)
    }

    function signup(input: SignupInput) {
      setUsers((prev) => {
        const nextIdx = Math.max(0, ...prev.map((u) => u.idx)) + 1
        const newUser: User = {
          idx: nextIdx,
          email: input.email,
          nickname: input.nickname,
          points: 100000,
          address: input.address,
          addressDetail: input.addressDetail,
        }
        setCurrentUser(newUser)
        return [...prev, newUser]
      })
    }

    function logout() {
      setCurrentUser(null)
    }

    function addProduct(input: AddProductInput) {
      if (!currentUser) return null
      const newProduct: Product = {
        id: Math.max(0, ...products.map((p) => p.id)) + 1,
        image: input.image || "/placeholder.svg?height=600&width=600",
        name: input.name,
        sellerIdx: currentUser.idx,
        sellerNickname: currentUser.nickname,
        price: input.price,
        description: input.description,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setProducts((prev) => [newProduct, ...prev])
      return newProduct
    }

    function applyProduct(productId: number) {
      if (!currentUser) {
        return { ok: false, message: "로그인이 필요합니다." }
      }
      const product = products.find((p) => p.id === productId)
      if (!product) {
        return { ok: false, message: "상품을 찾을 수 없습니다." }
      }
      if (product.sellerIdx === currentUser.idx) {
        return { ok: false, message: "본인이 등록한 상품은 신청할 수 없습니다." }
      }
      if (currentUser.points < product.price) {
        return { ok: false, message: "보유 포인트가 부족합니다." }
      }

      const updatedUser = {
        ...currentUser,
        points: currentUser.points - product.price,
      }
      setCurrentUser(updatedUser)
      setUsers((prev) =>
        prev.map((u) => (u.idx === updatedUser.idx ? updatedUser : u)),
      )
      setApplications((prev) => [
        {
          id: prev.length + 1,
          productId: product.id,
          productName: product.name,
          price: product.price,
          appliedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
      return { ok: true, message: "신청이 완료되었습니다." }
    }

    return {
      currentUser,
      users,
      products,
      applications,
      login,
      loginWithGoogle,
      signup,
      logout,
      addProduct,
      applyProduct,
    }
  }, [currentUser, users, products, applications])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider")
  }
  return ctx
}

export function formatPoints(value: number) {
  return `${value.toLocaleString("ko-KR")}P`
}
