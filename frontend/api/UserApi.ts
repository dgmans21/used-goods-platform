import axios from "axios"
import type { SignupInput, User } from "@/types/user"
import type { LoginResponse } from "@/types/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

const UserApi = {
  signup: async (data: SignupInput) => {
    const response = await axios.post(`${API_BASE}/api/users/createUser`, data)
    return response.data as { message: string; data: User }
  },
  login: async (data: { user_id: string; pw: string }) => {
    const response = await axios.post(`${API_BASE}/api/users/login`, data)
    return response.data as LoginResponse
  },
}

export default UserApi
