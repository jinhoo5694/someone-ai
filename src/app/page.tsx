'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track, EVENTS, initMixpanel } from '@/lib/mixpanel/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [needVerification, setNeedVerification] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    initMixpanel()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNeedVerification(false)
    setIsLoading(true)

    track(EVENTS.LOGIN_START)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.needVerification) {
          setNeedVerification(true)
        }
        setError(data.error || '로그인에 실패했습니다')
        return
      }

      track(EVENTS.LOGIN_SUCCESS)
      router.push('/characters')
    } catch {
      setError('서버 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        alert('인증 이메일을 다시 발송했습니다. 이메일을 확인해주세요.')
      } else {
        alert(data.error || '이메일 발송에 실패했습니다')
      }
    } catch {
      alert('서버 오류가 발생했습니다')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-pink-50 to-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">AI 채팅</h1>
          <p className="text-lg text-gray-600">
            당신의 이야기를 진심으로 들어주는 AI 친구
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl
                         focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl
                         focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="py-2">
              <p className="text-red-500 text-center">{error}</p>
              {needVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full mt-2 text-primary-500 text-base hover:underline"
                >
                  {resendLoading ? '발송 중...' : '인증 이메일 다시 받기'}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 text-white py-4 rounded-xl text-xl font-bold
                       hover:bg-primary-600 transition-colors disabled:bg-gray-300
                       active:scale-[0.98]"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-base">
              <span className="px-4 bg-gradient-to-b from-pink-50 to-white text-gray-500">
                또는
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              track(EVENTS.LOGIN_START)
              window.location.href = '/api/auth/google'
            }}
            className="mt-4 w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200
                       py-4 rounded-xl text-lg font-medium text-gray-700
                       hover:bg-gray-50 transition-colors active:scale-[0.98]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-3">아직 회원이 아니신가요?</p>
          <button
            onClick={() => router.push('/signup')}
            className="text-primary-500 text-lg font-medium hover:underline"
          >
            회원가입하기
          </button>
        </div>
      </div>
    </div>
  )
}
