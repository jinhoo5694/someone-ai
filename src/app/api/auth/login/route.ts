import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { createToken, setAuthCookie } from '@/lib/auth/jwt'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 사용자 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, nickname, password_hash, email_verified')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다' },
        { status: 401 }
      )
    }

    // 이메일 인증 확인
    if (!user.email_verified) {
      return NextResponse.json(
        {
          error: '이메일 인증이 필요합니다',
          needVerification: true,
          email: user.email,
        },
        { status: 403 }
      )
    }

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다' },
        { status: 401 }
      )
    }

    // 마지막 활동 시간 업데이트
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)

    // JWT 토큰 생성 및 쿠키 설정
    const token = await createToken({
      userId: user.id,
      username: user.email,
    })
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
