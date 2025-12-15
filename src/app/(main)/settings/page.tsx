'use client'

import { useRouter } from 'next/navigation'
import { initMixpanel } from '@/lib/mixpanel/client'
import { useEffect, useState } from 'react'
import type { UserProfile } from '@/types/user'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initMixpanel()

    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        setProfile(data.profile)
        setNickname(data.nickname)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const getGenderText = (gender?: string) => {
    if (gender === 'male') return '남성'
    if (gender === 'female') return '여성'
    if (gender === 'other') return '기타'
    return null
  }

  const hasProfile = nickname || (profile && (profile.age || profile.gender || profile.occupation))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b px-6 py-4 z-10">
        <h1 className="text-2xl font-bold">설정</h1>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-lg font-semibold">내 프로필</h2>
            <button
              onClick={() => router.push('/settings/profile')}
              className="text-primary-500 text-sm font-medium"
            >
              수정
            </button>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="text-gray-400 text-center py-4">로딩 중...</div>
            ) : hasProfile ? (
              <div className="space-y-3">
                {nickname && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">닉네임</span>
                    <span className="font-medium">{nickname}</span>
                  </div>
                )}
                {profile?.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">나이</span>
                    <span className="font-medium">{profile.age}세</span>
                  </div>
                )}
                {profile?.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">성별</span>
                    <span className="font-medium">{getGenderText(profile.gender)}</span>
                  </div>
                )}
                {profile?.occupation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">직업</span>
                    <span className="font-medium">{profile.occupation}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="font-medium text-gray-700 mb-1">당신에 대해 알려주세요.</p>
                <p className="text-gray-500 mb-4">더 깊은 대화를 나눌 수 있어요</p>
                <button
                  onClick={() => router.push('/settings/profile')}
                  className="bg-primary-500 text-white px-6 py-2 rounded-xl font-medium
                             hover:bg-primary-600 transition-colors"
                >
                  프로필 설정하기
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <h2 className="px-5 py-4 text-lg font-semibold border-b">계정</h2>
          <div className="divide-y">
            <button
              onClick={handleLogout}
              className="w-full px-5 py-4 text-left text-red-500 hover:bg-red-50 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </section>

        <p className="text-center text-gray-400 text-sm mt-8">
          Someone 썸원 v1.0.0
        </p>
      </main>
    </div>
  )
}
