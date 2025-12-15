'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/settings/ProfileForm'
import type { UserProfile } from '@/types/user'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  const handleSave = async (newProfile: UserProfile, newNickname: string) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: newProfile, nickname: newNickname }),
    })

    if (!res.ok) {
      throw new Error('Failed to save')
    }

    router.push('/settings')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b px-4 py-4 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/settings')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold">내 프로필</h1>
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        <p className="font-medium text-gray-700 mb-1">당신에 대해 알려주세요.</p>
        <p className="text-gray-500 mb-6">더 깊은 대화를 나눌 수 있어요</p>

        <ProfileForm
          initialProfile={profile}
          initialNickname={nickname}
          onSave={handleSave}
        />
      </main>
    </div>
  )
}
