import type { User } from "@/types/user"

export type LoginResponse = {
  message: string
  data: User
}

export type ApiMessageResponse<T = unknown> = {
  message: string
  data?: T
}
