"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { useAuthStore } from "@/store/authStore"

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
  const login = useAuthStore((s) => s.login)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

  const [user_id, setUserId] = useState("")
  const [pw, setPw] = useState("")

  const [errors, setErrors] = useState<{
    user_id?: string
    pw?: string
  }>({})


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nextErrors: {
      user_id?: string
      pw?: string
    } = {}

    if (!user_id.trim()) {
      nextErrors.user_id = "아이디를 입력해 주세요."
    }

    if (pw.length < 6) {
      nextErrors.pw = "비밀번호는 6자 이상이어야 합니다."
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    try {
      const ok = await login(user_id, pw)

      if (ok) {
        toast.success("로그인되었습니다.")
        router.push("/")
      } else {
        toast.error("로그인 실패", {
          description: "아이디 또는 비밀번호를 확인해 주세요.",
        })
      }
    } catch (error) {
      console.error("로그인 오류:", error)

      toast.error("로그인 중 오류가 발생했습니다.")
    }
  }


  async function handleGoogle() {
    try {
      const ok = await loginWithGoogle()

      if (ok) {
        toast.success("Google 계정으로 로그인되었습니다.")
        router.push("/")
      } else {
        toast.error("Google 로그인에 실패했습니다.")
      }
    } catch (error) {
      console.error("Google 로그인 실패:", error)

      toast.error("Google 로그인에 실패했습니다.")
    }
  }


  return (
    <main className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            로그인
          </CardTitle>

          <CardDescription>
            수성마켓에 오신 것을 환영합니다. 계속하려면 로그인해 주세요.
          </CardDescription>
        </CardHeader>


        <CardContent>
          <GoogleButton onClick={handleGoogle} />

          <FieldSeparator className="my-6">
            또는 아이디로 로그인
          </FieldSeparator>


          <form onSubmit={handleSubmit}>
            <FieldGroup>

              <Field data-invalid={!!errors.user_id}>
                <FieldLabel htmlFor="user_id">
                  아이디
                </FieldLabel>

                <Input
                  id="user_id"
                  type="text"
                  placeholder="아이디 입력"
                  value={user_id}
                  onChange={(e) => setUserId(e.target.value)}
                  aria-invalid={!!errors.user_id}
                />

                <FieldError>
                  {errors.user_id}
                </FieldError>
              </Field>


              <Field data-invalid={!!errors.pw}>
                <FieldLabel htmlFor="pw">
                  비밀번호
                </FieldLabel>

                <Input
                  id="pw"
                  type="password"
                  placeholder="••••••••"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  aria-invalid={!!errors.pw}
                />

                <FieldError>
                  {errors.pw}
                </FieldError>
              </Field>


              <Button type="submit" className="w-full">
                로그인
              </Button>


              <FieldDescription className="text-center">
                아직 회원이 아니신가요?{" "}

                <Link
                  href="/signup"
                  className="text-primary underline"
                >
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
