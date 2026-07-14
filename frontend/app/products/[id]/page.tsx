"use client"

import Image from "next/image"
import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { AlertTriangle, ArrowLeft, CheckCircle2, Coins } from "lucide-react"
import { toast } from "sonner"

import { formatPoints, useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { products, currentUser, applyProduct } = useStore()
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)

  const product = products.find((p) => p.id === Number(params.id))
  if (!product) {
    notFound()
  }

  const isOwner = currentUser?.idx === product.sellerIdx
  const points = currentUser?.points ?? 0
  const insufficient = points < product.price
  const remaining = points - product.price

  function handleApplyClick() {
    if (!currentUser) {
      toast.error("로그인이 필요합니다.")
      router.push("/login")
      return
    }
    setDone(false)
    setOpen(true)
  }

  function handleConfirm() {
    const result = applyProduct(product?.id ?? 0 as number)
    if (result.ok) {
      setDone(true)
      toast.success("신청이 완료되었습니다.")
    } else {
      toast.error(result.message)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/" />}
        className="mb-4 text-muted-foreground"
      >
        <ArrowLeft data-icon="inline-start" />
        목록으로
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-balance">{product.name}</h1>
          <p className="mt-3 text-3xl font-bold text-primary">
            {formatPoints(product.price)}
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border p-4">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {product.sellerNickname.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{product.sellerNickname}</p>
              <p className="text-xs text-muted-foreground">
                판매자 · {product.createdAt} 등록
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <h2 className="mb-2 text-sm font-semibold">상품 설명</h2>
          <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8">
            {isOwner ? (
              <Badge variant="secondary" className="py-2">
                내가 등록한 상품입니다
              </Badge>
            ) : (
              <Button size="lg" className="w-full" onClick={handleApplyClick}>
                <Coins data-icon="inline-start" />
                상품 신청하기
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {done ? (
            <>
              <DialogHeader>
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="size-6 text-primary" />
                </div>
                <DialogTitle className="text-center">신청 완료</DialogTitle>
                <DialogDescription className="text-center">
                  {product.name} 신청이 완료되었습니다. 판매자에게 알림이
                  전달됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">차감 포인트</span>
                  <span className="font-medium">
                    -{formatPoints(product.price)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">남은 포인트</span>
                  <span className="font-semibold text-primary">
                    {formatPoints(currentUser?.points ?? 0)}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  nativeButton={false}
                  render={<Link href="/mypage" />}
                >
                  마이페이지로
                </Button>
                <DialogClose render={<Button />}>확인</DialogClose>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>상품 신청하기</DialogTitle>
                <DialogDescription>
                  보유 포인트를 확인하고 신청을 진행해 주세요.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="relative size-14 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {formatPoints(product.price)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">보유 포인트</span>
                    <span className="font-medium">{formatPoints(points)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">상품 가격</span>
                    <span className="font-medium">
                      -{formatPoints(product.price)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">신청 후 잔액</span>
                    <span
                      className={
                        insufficient
                          ? "font-semibold text-destructive"
                          : "font-semibold text-primary"
                      }
                    >
                      {insufficient ? "부족" : formatPoints(remaining)}
                    </span>
                  </div>
                </div>

                {insufficient && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      보유 포인트가 부족합니다. 상품을 등록하거나 포인트를 충전해
                      주세요.
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  취소
                </DialogClose>
                <Button disabled={insufficient} onClick={handleConfirm}>
                  {formatPoints(product.price)} 신청하기
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
