import { NextResponse } from 'next/server'
import { removeAuthCookie } from '@/lib/auth/jwt'

export async function POST() {
  try {
    await removeAuthCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: '로그아웃에 실패했습니다' },
      { status: 500 }
    )
  }
}
