'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { initMixpanel } from '@/lib/mixpanel/client'

interface ConversationSummary {
  characterId: string
  characterName: string
  characterImage: string
  lastMessage: string
  lastMessageTime: string
  updatedAt: string
}

export default function ChatsPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initMixpanel()

    async function fetchConversations() {
      try {
        const res = await fetch('/api/conversations')
        const data = await res.json()
        setConversations(data.conversations || [])
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (days === 1) {
      return '어제'
    } else if (days < 7) {
      return `${days}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })
    }
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
      <header className="sticky top-0 bg-white border-b px-6 py-4 z-10">
        <h1 className="text-2xl font-bold">채팅</h1>
      </header>

      <main>
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-gray-500 text-lg mb-4">아직 대화가 없어요</p>
            <button
              onClick={() => router.push('/friends')}
              className="text-primary-500 text-lg font-medium"
            >
              친구 찾아보기
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <button
                key={conv.characterId}
                onClick={() => router.push(`/chats/${conv.characterId}`)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <img
                  src={conv.characterImage}
                  alt={conv.characterName}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-semibold truncate">
                      {conv.characterName}
                    </h3>
                    <span className="text-sm text-gray-400 ml-2 shrink-0">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
