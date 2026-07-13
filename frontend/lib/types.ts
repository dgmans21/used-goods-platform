export type User = {
  idx: number
  email: string
  nickname: string
  points: number
  address: string
  addressDetail: string
}

export type Product = {
  id: number
  image: string
  name: string
  sellerIdx: number
  sellerNickname: string
  price: number
  description: string
  createdAt: string
}

export type Application = {
  id: number
  productId: number
  productName: string
  price: number
  appliedAt: string
}
