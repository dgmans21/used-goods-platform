"use client"

import axios, { AxiosError } from "axios"
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
import AddressSearch from "@/components/address-search"

type FormState = {
  userId: string
  password: string
  passwordConfirm: string
  nickname: string
  address: string
  address2: string
}

type Errors = Partial<Record<keyof FormState, string>>

export default function SignupPage() {
  const router = useRouter()
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

  const [form, setForm] = useState<FormState>({
    userId: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    address: "",
    address2: "",
  })

  const [errors, setErrors] = useState<Errors>({})

  function update(
    key: keyof FormState,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  function validate(): Errors {
    const next: Errors = {}

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.userId)) {
      next.userId = "올바른 이메일 형식을 입력해 주세요."
    }

    if (form.password.length < 8) {
      next.password = "비밀번호는 8자 이상이어야 합니다."
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
  console.log(
    process.env.NEXT_PUBLIC_API_URL
  )
  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    const next = validate()

    setErrors(next)

    if (Object.keys(next).length > 0) return

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/createUser`,
        {
          user_id: form.userId,
          pw: form.password,
          nickname: form.nickname,
          address: form.address,
          address2: form.address2,
        }
      )

      toast.success(
        "회원가입이 완료되었습니다."
      )

      router.push("/login")


    
    } catch (error) {
      console.error("회원가입 실패:", error);
    
      // 기본 실패 메시지 설정
      let errorMessage = "회원가입에 실패했습니다. 다시 시도해주세요.";
    
      // 백엔드(서버) 응답이 있는 경우
      if (error instanceof AxiosError) {
        const status = error.response?.status;
    
        if (status === 409 || status === 400) {
          // 409 Conflict 또는 400 Bad Request: 이미 가입된 유저(중복 오류)
          errorMessage = "이미 가입된 계정입니다. 다른 계정으로 시도해주세요.";
        } else if (status && status >= 500) {
          // 500 이상: 서버 시스템 자체의 오류
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
      } else if (error instanceof AxiosError) {
        // 요청은 보냈으나 서버로부터 아예 응답을 받지 못한 경우 (네트워크 다운 등)
        errorMessage = "서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요.";
      }
    
      // 최종 결정된 에러 메시지를 토스트로 출력
      toast.error(errorMessage);
    }
  }

  async function handleGoogle() {
    try {
      const ok = await loginWithGoogle()
      if (ok) {
        toast.success("Google 계정으로 가입되었습니다.")
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
    <main className="mx-auto flex w-full max-w-lg flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            회원가입
          </CardTitle>

          <CardDescription>
            수성마켓 회원이 되어 안전하게 중고거래를 시작하세요.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <GoogleButton
            onClick={handleGoogle}
            label="Google 계정으로 가입하기"
          />

          <FieldSeparator className="my-6">
            또는 이메일로 가입
          </FieldSeparator>

          <form onSubmit={handleSubmit}>
            <FieldGroup>

              <Field data-invalid={!!errors.userId}>
                <FieldLabel htmlFor="userId">
                  이메일
                </FieldLabel>

                <Input
                  id="userId"
                  type="email"
                  placeholder="you@example.com"
                  value={form.userId}
                  onChange={(e) =>
                    update(
                      "userId",
                      e.target.value
                    )
                  }
                  aria-invalid={!!errors.userId}
                />

                <FieldError>
                  {errors.userId}
                </FieldError>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">

                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">
                    비밀번호
                  </FieldLabel>

                  <Input
                    id="password"
                    type="password"
                    placeholder="8자 이상"
                    value={form.password}
                    onChange={(e) =>
                      update(
                        "password",
                        e.target.value
                      )
                    }
                    aria-invalid={!!errors.password}
                  />

                  <FieldError>
                    {errors.password}
                  </FieldError>
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
                      update(
                        "passwordConfirm",
                        e.target.value
                      )
                    }
                    aria-invalid={
                      !!errors.passwordConfirm
                    }
                  />

                  <FieldError>
                    {errors.passwordConfirm}
                  </FieldError>
                </Field>

              </div>

              <Field data-invalid={!!errors.nickname}>
            <FieldLabel htmlFor="nickname">
              닉네임
            </FieldLabel>

            <Input
              id="nickname"
              value={form.nickname}
              onChange={(e) =>
                update(
                  "nickname",
                  e.target.value
                )
              }
              aria-invalid={!!errors.nickname}
            />

            <FieldError>
              {errors.nickname}
            </FieldError>
          </Field>


          <Field data-invalid={!!errors.address}>
            <FieldLabel htmlFor="address">
              주소
            </FieldLabel>

            <div className="flex gap-2">
              <Input
                id="address"
                value={form.address}
                readOnly
                placeholder="주소검색"
                aria-invalid={!!errors.address}
              />

              <AddressSearch
                onComplete={(data) => {
                  update(
                    "address",
                    data.roadAddress
                  )
                }}
              />
            </div>

            <FieldError>
              {errors.address}
            </FieldError>
          </Field>


          <Field>
  <FieldLabel htmlFor="address2">
    상세주소
  </FieldLabel>

  <Input
    id="address2"
    value={form.address2}
    onChange={(e) =>
      update(
        "address2",
        e.target.value
      )
    }
  />

  <FieldDescription>
    상세주소는 거래 참고용입니다.
  </FieldDescription>
</Field>

              <Button
                type="submit"
                className="w-full"
              >
                가입하기
              </Button>

              <FieldDescription className="text-center">
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="text-primary underline"
                >
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