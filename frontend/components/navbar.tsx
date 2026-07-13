"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Coins, LogOut, Menu, PlusCircle, Store, User } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { formatPoints, useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const navLinks = [
  { href: "/", label: "상품 리스트" },
  { href: "/sell", label: "상품 등록" },
  { href: "/mypage", label: "마이페이지" },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout } = useStore()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    setOpen(false)
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">수성마켓</span>
            <span className="text-[11px] text-muted-foreground">
              수성인재육성랩 중고거래
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              nativeButton={false}
              render={<Link href={link.href} />}
              className={cn(
                "text-muted-foreground",
                pathname === link.href && "bg-accent text-accent-foreground",
              )}
            >
              {link.label}
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {currentUser ? (
            <>
              <Badge variant="secondary" className="gap-1 py-1.5">
                <Coins className="size-3.5" />
                {formatPoints(currentUser.points)}
              </Badge>
              <Link
                href="/mypage"
                className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-accent"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {currentUser.nickname.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {currentUser.nickname}
                </span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut data-icon="inline-start" />
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                로그인
              </Button>
              <Button nativeButton={false} render={<Link href="/signup" />}>
                회원가입
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴 열기"
        >
          <Menu />
        </Button>
      </div>

      {open && (
        <div className="border-t bg-background md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3">
            {currentUser && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-accent px-3 py-2">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  <span className="text-sm font-medium">
                    {currentUser.nickname}
                  </span>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Coins className="size-3.5" />
                  {formatPoints(currentUser.points)}
                </Badge>
              </div>
            )}
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                className="justify-start"
                nativeButton={false}
                render={<Link href={link.href} />}
                onClick={() => setOpen(false)}
              >
                {link.label === "상품 등록" && (
                  <PlusCircle data-icon="inline-start" />
                )}
                {link.label}
              </Button>
            ))}
            <div className="mt-2 border-t pt-2">
              {currentUser ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut data-icon="inline-start" />
                  로그아웃
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/login" />}
                    onClick={() => setOpen(false)}
                  >
                    로그인
                  </Button>
                  <Button
                    nativeButton={false}
                    render={<Link href="/signup" />}
                    onClick={() => setOpen(false)}
                  >
                    회원가입
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
