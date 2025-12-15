'use client'

import type { Character } from '@/types/character'

interface CharacterCardProps {
  character: Character
  onSelect: () => void
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export function CharacterCard({ character, onSelect }: CharacterCardProps) {
  const { info, profileImageUrl } = character
  const age = calculateAge(info.birth)

  return (
    <button
      onClick={onSelect}
      className="w-full bg-white rounded-2xl shadow-lg overflow-hidden
                 active:scale-[0.98] transition-transform text-left"
    >
      {/* 프로필 이미지 */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={profileImageUrl}
          alt={info.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 정보 영역 */}
      <div className="p-5">
        <h3 className="text-2xl font-bold mb-1">{info.name}</h3>
        <p className="text-gray-600 text-lg mb-3">
          {age}세 · {info.job}
        </p>
        <p className="text-gray-700 text-lg leading-relaxed line-clamp-2">
          {info.introduction}
        </p>

        {/* 태그 */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-3 py-1.5 bg-pink-100 text-pink-600 rounded-full text-base font-medium">
            {info.mbti}
          </span>
          {info.hobbies.slice(0, 2).map((hobby) => (
            <span
              key={hobby}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-base"
            >
              {hobby}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
