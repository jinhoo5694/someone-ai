'use client'

import { useState } from 'react'
import type { Character } from '@/types/character'

interface CharacterProfileProps {
  character: Character
  onStartChat: () => void
}

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function CharacterProfile({ character, onStartChat }: CharacterProfileProps) {
  const { info, profileImageUrl } = character
  const age = calculateAge(info.birth)
  const [showImageModal, setShowImageModal] = useState(false)

  return (
    <div className="pb-40">
      <div className="p-6 pt-16">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setShowImageModal(true)}>
            <img
              src={profileImageUrl}
              alt={info.name}
              className="w-20 h-20 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
          </button>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold">{info.name}</h1>
              <span className="text-lg text-gray-500">{age}세</span>
            </div>
            <p className="text-base text-gray-600">{info.job}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1.5 bg-pink-100 text-pink-600 rounded-full text-base font-medium">
            {info.mbti}
          </span>
          {info.hobbies.map((hobby) => (
            <span
              key={hobby}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-base"
            >
              {hobby}
            </span>
          ))}
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">자기소개</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            {info.introduction}
          </p>
        </div>

        {info.extra && (
          <div className="bg-gray-50 rounded-2xl p-5 mb-6">
            <h2 className="text-lg font-semibold mb-3">더 알아보기</h2>
            <p className="text-gray-700 text-lg leading-relaxed">{info.extra}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-gray-500 text-sm mb-1">키</p>
            <p className="text-xl font-semibold">{info.height}cm</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-gray-500 text-sm mb-1">몸무게</p>
            <p className="text-xl font-semibold">{info.weight}kg</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t z-40">
        <button
          onClick={onStartChat}
          className="w-full bg-primary-500 text-white py-4 rounded-xl text-xl font-bold
                     hover:bg-primary-600 transition-colors active:scale-[0.98]"
        >
          {info.name}님과 대화하기
        </button>
      </div>

      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white p-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={profileImageUrl}
            alt={info.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
