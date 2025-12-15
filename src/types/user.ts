export interface UserProfile {
  age?: number | null
  gender?: 'male' | 'female' | 'other' | null
  occupation?: string | null
}

export interface User {
  id: string
  email: string
  email_verified: boolean
  nickname: string | null
  profile: UserProfile | null
  created_at: string
  last_active_at: string | null
}
