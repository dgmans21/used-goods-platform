export type Product = {
  id: number
  image: string
  name: string
  sellerId: number
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
