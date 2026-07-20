"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import axios from "axios"
import { signInWithPopup } from "firebase/auth"

import { auth, googleProvider } from "@/firebase"
import { toUser, type SignupInput, type User } from "@/types/user"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

type AuthState = {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  login: (userId: string, pw: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  signup: (input: SignupInput) => Promise<boolean>
  logout: () => void
  
  // 🚀 포인트 상태 변경 및 충전 액션
  updatePoint: (newPoint: number) => void
  chargePoints: (amount: number) => Promise<number>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,

      setCurrentUser(user) {
        set({ currentUser: user })
      },

      async login(userId, pw) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/users/login`, {
            user_id: userId,
            pw,
          })

          const user = toUser(data?.data)
          if (!user) return false

          set({ currentUser: user })
          return true
        } catch (error) {
          // 💡 변경: console.error 대신 가벼운 경고나 로그로 대체하거나 아예 지우기!
          // 진짜 서버가 터진 건지(500), 비번만 틀린 건지(401) 구별해서 로깅하면 더 좋습니다.
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            console.warn("로그인 실패: 인증 정보 불일치 )")
          } else {
            console.error("시스템 오류인 경우에만 오류출력:", error)
          }
          return false
        }
      },

      async loginWithGoogle() {
        try {
          const result = await signInWithPopup(auth, googleProvider)
          const firebaseUser = result.user

          if (!firebaseUser.email) {
            throw new Error("Google 이메일 정보를 가져올 수 없습니다.")
          }

          const { data } = await axios.post(`${API_BASE}/api/users/google`, {
            user_id: firebaseUser.email,
            nickname: firebaseUser.displayName ?? "Google 사용자",
            address: "",
            address2: "",
            firebase_uid: firebaseUser.uid,
          })

          const user = toUser(data?.data)
          if (!user) return false

          set({ currentUser: user })
          return true
        } catch (error) {
          console.error("Google 로그인 실패:", error)
          return false
        }
      },

      async signup(input) {
        try {
          const { data } = await axios.post(
            `${API_BASE}/api/users/createUser`,
            {
              user_id: input.user_id,
              pw: input.pw,
              nickname: input.nickname,
              address: input.address,
              address2: input.address2,
            },
          )

          const user = toUser(data?.data)
          if (!user) return false

          set({ currentUser: user })
          return true
        } catch (error) {
          console.error("회원가입 실패:", error)
          return false
        }
      },

      logout() {
        set({ currentUser: null })
        void useAuthStore.persist.clearStorage()
      },

      // 🚀 안전하게 포인트 상태만 갱신하는 단순 상태 동기화 액션
      updatePoint(newPoint) {
        const user = get().currentUser
        if (user) {
          set({
            currentUser: {
              ...user,
              point: newPoint,
            },
          })
        }
      },

      // 🚀 [포인트 충전 비즈니스 로직]
      async chargePoints(amount) {
        const state = get()
        const user = state.currentUser
        
        if (!user || !user.id) {
          throw new Error("로그인 정보가 올바르지 않습니다.")
        }

        try {
          // Express 백엔드 서버에 실제 충전 API 요청 전송
          const response = await axios.post(`${API_BASE}/api/applications/charge`, {
            userId: Number(user.id),
            amount: amount,
          })

          const updatedPoint = response.data.point

          // 내부의 updatePoint를 호출하여 안전하게 싱크 맞춤
          get().updatePoint(updatedPoint)

          return updatedPoint
        } catch (err: any) {
          const errMsg = err.response?.data?.error || "포인트 충전 중 오류가 발생했습니다."
          throw new Error(errMsg)
        }
      },
    }),
    {
      // ⚠️ [중요] 키 이름 중복 방지를 위해 유니크하게 이름 변경!
      name: "user-auth-session", 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentUser: state.currentUser }),
    },
  ),
)