import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendVerificationEmail, generateVerificationToken } from '@/lib/email/client'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 사용자 확인
    const { data: user } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      return NextResponse.json(
        { error: '가입되지 않은 이메일입니다' },
        { status: 404 }
      )
    }

    if (user.email_verified) {
      return NextResponse.json(
        { error: '이미 인증된 이메일입니다' },
        { status: 400 }
      )
    }

    // 인증 토큰 생성
    const verificationToken = generateVerificationToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간

    // 기존 인증 토큰 삭제
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email.toLowerCase())

    // 새 인증 토큰 저장
    await supabase.from('email_verifications').insert({
      email: email.toLowerCase(),
      token: verificationToken,
      expires_at: expiresAt.toISOString(),
    })

    // 인증 이메일 발송
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const verificationUrl = `${protocol}://${host}/verify-email?token=${verificationToken}`

    const emailSent = await sendVerificationEmail(email, verificationUrl)

    if (!emailSent) {
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '인증 이메일을 다시 발송했습니다',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
