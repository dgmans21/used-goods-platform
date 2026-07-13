"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { GoogleButton } from "@/components/google-button"

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle } = useStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: { email?: string; password?: string } = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "올바른 이메일 형식을 입력해 주세요."
    }
    if (password.length < 6) {
      nextErrors.password = "비밀번호는 6자 이상이어야 합니다."
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const ok = login(email)
    if (ok) {
      toast.success("로그인되었습니다.")
      router.push("/")
    } else {
      toast.error("등록되지 않은 계정입니다.", {
        description: "hana@example.com 으로 로그인해 보세요.",
      })
    }
  }

  function handleGoogle() {
    loginWithGoogle()
    toast.success("Google 계정으로 로그인되었습니다.")
    router.push("/")
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            수성마켓에 오신 것을 환영합니다. 계속하려면 로그인해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleButton onClick={handleGoogle} />
          <FieldSeparator className="my-6">또는 이메일로 로그인</FieldSeparator>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                />
                <FieldError>{errors.email}</FieldError>
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
                <FieldError>{errors.password}</FieldError>
              </Field>
              <Button type="submit" className="w-full">
                로그인
              </Button>
              <FieldDescription className="text-center">
                아직 회원이 아니신가요?{" "}
                <Link href="/signup" className="text-primary underline">
                  회원가입
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
