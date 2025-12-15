'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Character } from '@/types/character'
import { track, EVENTS, initMixpanel } from '@/lib/mixpanel/client'

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

export default function FriendsPage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initMixpanel()
    track(EVENTS.CHARACTER_VIEW)

    async function fetchCharacters() {
      try {
        const res = await fetch('/api/characters')
        const data = await res.json()
        setCharacters(data.characters)
      } catch (error) {
        console.error('Failed to fetch characters:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCharacters()
  }, [])

  const handleSelectCharacter = (character: Character) => {
    track(EVENTS.CHARACTER_SELECT, { characterId: character.id })
    router.push(`/friends/${character.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b px-4 py-3 z-10">
        <h1 className="text-xl font-bold">친구</h1>
      </header>

      <main>
        {characters.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            아직 친구가 없어요
          </div>
        ) : (
          <div className="divide-y">
            {characters.map((character) => {
              const age = calculateAge(character.info.birth)
              return (
                <button
                  key={character.id}
                  onClick={() => handleSelectCharacter(character)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50
                             active:bg-gray-100 transition-colors text-left"
                >
                  <img
                    src={character.profileImageUrl}
                    alt={character.info.name}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{character.info.name}</span>
                      <span className="text-sm text-gray-400">{age}세</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {character.info.job} · {character.info.mbti}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
