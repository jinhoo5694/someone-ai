'use client'

import { useState } from 'react'
import type { UserProfile } from '@/types/user'

interface ProfileFormProps {
  initialProfile: UserProfile | null
  initialNickname: string | null
  onSave: (profile: UserProfile, nickname: string) => Promise<void>
}

export function ProfileForm({ initialProfile, initialNickname, onSave }: ProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile>({
    age: initialProfile?.age ?? null,
    gender: initialProfile?.gender ?? null,
    occupation: initialProfile?.occupation ?? null,
  })
  const [nickname, setNickname] = useState(initialNickname || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    try {
      await onSave(profile, nickname)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          닉네임
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="AI가 부를 이름"
          className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl
                     focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          나이
        </label>
        <input
          type="number"
          value={profile.age || ''}
          onChange={(e) => setProfile({ ...profile, age: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="예: 55"
          min={1}
          max={120}
          className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl
                     focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          성별
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'male', label: '남성' },
            { value: 'female', label: '여성' },
            { value: 'other', label: '기타' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setProfile({ ...profile, gender: option.value as UserProfile['gender'] })}
              className={`py-3 rounded-xl text-lg font-medium transition-colors ${
                profile.gender === option.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          직업
        </label>
        <input
          type="text"
          value={profile.occupation || ''}
          onChange={(e) => setProfile({ ...profile, occupation: e.target.value || null })}
          placeholder="예: 회사원, 자영업, 은퇴"
          className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl
                     focus:border-primary-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary-500 text-white py-4 rounded-xl text-xl font-bold
                   hover:bg-primary-600 transition-colors disabled:bg-gray-300
                   active:scale-[0.98]"
      >
        {saving ? '저장 중...' : saved ? '저장 완료!' : '저장하기'}
      </button>
    </form>
  )
}
