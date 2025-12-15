'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('인증 토큰이 없습니다')
      return
    }

    async function verifyEmail() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()

        if (res.ok) {
          setStatus('success')
          setMessage('이메일 인증이 완료되었습니다!')
          // 3초 후 캐릭터 선택 페이지로 이동
          setTimeout(() => {
            router.push('/characters')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || '인증에 실패했습니다')
        }
      } catch {
        setStatus('error')
        setMessage('서버 오류가 발생했습니다')
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-pink-50 to-white">
      <div className="w-full max-w-sm text-center">
        {status === 'loading' && (
          <>
            <div className="text-6xl mb-6">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              인증 확인 중...
            </h1>
            <p className="text-gray-600">잠시만 기다려주세요</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {message}
            </h1>
            <p className="text-gray-600 mb-6">
              잠시 후 자동으로 이동합니다...
            </p>
            <button
              onClick={() => router.push('/characters')}
              className="text-primary-500 text-lg font-medium hover:underline"
            >
              바로 시작하기
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              인증 실패
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="text-primary-500 text-lg font-medium hover:underline"
            >
              로그인 페이지로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl text-gray-500">로딩 중...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
