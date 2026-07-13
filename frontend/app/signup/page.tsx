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

type FormState = {
  email: string
  password: string
  passwordConfirm: string
  nickname: string
  address: string
  addressDetail: string
}

type Errors = Partial<Record<keyof FormState, string>>

export default function SignupPage() {
  const router = useRouter()
  const { signup, loginWithGoogle } = useStore()
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    address: "",
    addressDetail: "",
  })
  const [errors, setErrors] = useState<Errors>({})

  function update(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "올바른 이메일 형식을 입력해 주세요."
    }
    if (form.password.length < 6) {
      next.password = "비밀번호는 6자 이상이어야 합니다."
    }
    if (form.password !== form.passwordConfirm) {
      next.passwordConfirm = "비밀번호가 일치하지 않습니다."
    }
    if (form.nickname.trim().length < 2) {
      next.nickname = "닉네임은 2자 이상 입력해 주세요."
    }
    if (form.address.trim().length === 0) {
      next.address = "주소를 입력해 주세요."
    }
    return next
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    signup({
      email: form.email,
      nickname: form.nickname,
      address: form.address,
      addressDetail: form.addressDetail,
    })
    toast.success("회원가입이 완료되었습니다.", {
      description: "가입 축하 포인트 100,000P가 지급되었습니다.",
    })
    router.push("/")
  }

  function handleGoogle() {
    loginWithGoogle()
    toast.success("Google 계정으로 가입되었습니다.")
    router.push("/")
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>
            수성마켓 회원이 되어 안전하게 중고거래를 시작하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleButton
            onClick={handleGoogle}
            label="Google 계정으로 가입하기"
          />
          <FieldSeparator className="my-6">또는 이메일로 가입</FieldSeparator>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={!!errors.email}
                />
                <FieldError>{errors.email}</FieldError>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="6자 이상"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  <FieldError>{errors.password}</FieldError>
                </Field>
                <Field data-invalid={!!errors.passwordConfirm}>
                  <FieldLabel htmlFor="passwordConfirm">
                    비밀번호 확인
                  </FieldLabel>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={form.passwordConfirm}
                    onChange={(e) =>
                      update("passwordConfirm", e.target.value)
                    }
                    aria-invalid={!!errors.passwordConfirm}
                  />
                  <FieldError>{errors.passwordConfirm}</FieldError>
                </Field>
              </div>

              <Field data-invalid={!!errors.nickname}>
                <FieldLabel htmlFor="nickname">닉네임</FieldLabel>
                <Input
                  id="nickname"
                  placeholder="거래 시 표시될 이름"
                  value={form.nickname}
                  onChange={(e) => update("nickname", e.target.value)}
                  aria-invalid={!!errors.nickname}
                />
                <FieldError>{errors.nickname}</FieldError>
              </Field>

              <Field data-invalid={!!errors.address}>
                <FieldLabel htmlFor="address">주소</FieldLabel>
                <Input
                  id="address"
                  placeholder="예) 대구광역시 수성구 달구벌대로"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  aria-invalid={!!errors.address}
                />
                <FieldError>{errors.address}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="addressDetail">상세주소</FieldLabel>
                <Input
                  id="addressDetail"
                  placeholder="예) 101동 1201호"
                  value={form.addressDetail}
                  onChange={(e) => update("addressDetail", e.target.value)}
                />
                <FieldDescription>
                  상세주소는 거래 시 참고용으로 사용됩니다.
                </FieldDescription>
              </Field>

              <Button type="submit" className="w-full">
                가입하기
              </Button>
              <FieldDescription className="text-center">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-primary underline">
                  로그인
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
