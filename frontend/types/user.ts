/** 클라이언트에 보관하는 유저 (비밀번호 제외) — 백엔드 user 테이블과 동일 필드 */
export type User = {
  id: number
  user_id: string
  nickname: string
  address: string
  address2: string
  point: number
  created_at?: string | Date | null
  updated_at?: string | Date | null
  is_active?: "Y" | "N" | null
  user_lat?: number | null
  user_lng?: number | null
  firebase_uid?: string | null
}

export type SignupInput = {
  user_id: string
  pw: string
  nickname: string
  address: string
  address2: string
}

/** API 응답에서 pw 등을 걸러 User로 맞춤 */
export function toUser(raw: Record<string, unknown> | null | undefined): User | null {
  if (!raw || raw.id == null) return null

  return {
    id: Number(raw.id),
    user_id: String(raw.user_id ?? ""),
    nickname: String(raw.nickname ?? ""),
    address: String(raw.address ?? ""),
    address2: String(raw.address2 ?? ""),
    point: Number(raw.point ?? 0),
    created_at: (raw.created_at as User["created_at"]) ?? null,
    updated_at: (raw.updated_at as User["updated_at"]) ?? null,
    is_active: (raw.is_active as User["is_active"]) ?? null,
    user_lat: raw.user_lat != null ? Number(raw.user_lat) : null,
    user_lng: raw.user_lng != null ? Number(raw.user_lng) : null,
    firebase_uid: raw.firebase_uid != null ? String(raw.firebase_uid) : null,
  }
}
