import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { sendVerificationEmail, generateVerificationToken } from '@/lib/email/client'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password, nickname } = await request.json()

    // 유효성 검사
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식을 입력해주세요' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 이메일 중복 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      if (existingUser.email_verified) {
        return NextResponse.json(
          { error: '이미 가입된 이메일입니다' },
          { status: 409 }
        )
      } else {
        // 미인증 계정 삭제 후 재가입 허용
        await supabase.from('users').delete().eq('id', existingUser.id)
      }
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10)

    // 사용자 생성 (미인증 상태)
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        email_verified: false,
        nickname: nickname || email.split('@')[0],
      })
      .select('id, email, nickname')
      .single()

    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json(
        { error: '회원가입에 실패했습니다' },
        { status: 500 }
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
      console.error('Failed to send verification email')
      // 이메일 발송 실패해도 가입은 완료 처리 (재발송 가능)
    }

    return NextResponse.json({
      success: true,
      message: '인증 이메일을 발송했습니다. 이메일을 확인해주세요.',
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
