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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
          console.error("로그인 실패:", error)
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
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentUser: state.currentUser }),
    },
  ),
)
