import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createToken, setAuthCookie } from '@/lib/auth/jwt'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 토큰 조회
    const { data: verification, error: verifyError } = await supabase
      .from('email_verifications')
      .select('email, expires_at')
      .eq('token', token)
      .single()

    if (verifyError || !verification) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 링크입니다' },
        { status: 400 }
      )
    }

    // 만료 확인
    if (new Date(verification.expires_at) < new Date()) {
      // 만료된 토큰 삭제
      await supabase.from('email_verifications').delete().eq('token', token)
      return NextResponse.json(
        { error: '인증 링크가 만료되었습니다. 다시 가입해주세요.' },
        { status: 400 }
      )
    }

    // 사용자 인증 완료 처리
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('email', verification.email)
      .select('id, email, nickname')
      .single()

    if (updateError || !user) {
      return NextResponse.json(
        { error: '인증 처리에 실패했습니다' },
        { status: 500 }
      )
    }

    // 사용된 토큰 삭제
    await supabase.from('email_verifications').delete().eq('token', token)

    // JWT 토큰 생성 및 쿠키 설정 (자동 로그인)
    const jwtToken = await createToken({
      userId: user.id,
      username: user.email,
    })
    await setAuthCookie(jwtToken)

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
