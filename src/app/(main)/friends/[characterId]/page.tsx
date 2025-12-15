'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Character } from '@/types/character'
import { CharacterProfile } from '@/components/character/CharacterProfile'
import { track, EVENTS, initMixpanel } from '@/lib/mixpanel/client'

export default function CharacterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const characterId = params.characterId as string

  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initMixpanel()

    async function fetchCharacter() {
      try {
        const res = await fetch('/api/characters')
        const data = await res.json()
        const char = data.characters.find((c: Character) => c.id === characterId)
        setCharacter(char || null)
      } catch (error) {
        console.error('Failed to fetch character:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCharacter()
  }, [characterId])

  const handleStartChat = () => {
    track(EVENTS.CHARACTER_SELECT, { characterId })
    router.push(`/chats/${characterId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-xl text-gray-500 mb-4">캐릭터를 찾을 수 없어요</div>
        <button
          onClick={() => router.push('/friends')}
          className="text-primary-500 text-lg"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-20">
        <button
          onClick={() => router.push('/friends')}
          className="m-4 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg"
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
      </header>

      <CharacterProfile character={character} onStartChat={handleStartChat} />
    </div>
  )
}
