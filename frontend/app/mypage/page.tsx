"use client"

import Link from "next/link"
import { Coins, MapPin, Package, Receipt } from "lucide-react"

import { formatPoints, useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProductCard } from "@/components/product-card"

export default function MyPage() {
  const { currentUser, products, applications } = useStore()

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

  const myProducts = products.filter((p) => p.sellerIdx === currentUser.idx)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">마이페이지</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/10 text-xl text-primary">
                {currentUser.nickname.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold">{currentUser.nickname}</p>
              <p className="text-sm text-muted-foreground">
                {currentUser.email}
              </p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {currentUser.address} {currentUser.addressDetail}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex h-full flex-col justify-center gap-1">
            <span className="flex items-center gap-1.5 text-sm text-primary-foreground/85">
              <Coins className="size-4" />
              보유 포인트
            </span>
            <p className="text-3xl font-bold">
              {formatPoints(currentUser.points)}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Package className="size-5 text-primary" />
          <h2 className="text-lg font-bold">내가 등록한 상품</h2>
          <Badge variant="secondary">{myProducts.length}</Badge>
        </div>
        {myProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {myProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">
              아직 등록한 상품이 없어요.
            </p>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/sell" />}
            >
              상품 등록하기
            </Button>
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="size-5 text-primary" />
          <h2 className="text-lg font-bold">신청 내역</h2>
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
                        <p className="text-sm font-medium">
                          {app.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.appliedAt} 신청
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
    </main>
  )
}
