'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Character } from '@/types/character'
import type { Message } from '@/types/chat'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { FakeDoorModal } from '@/components/premium/FakeDoorModal'
import { track, EVENTS, initMixpanel } from '@/lib/mixpanel/client'
import { APP_CONFIG } from '@/lib/config/constants'

const DEBOUNCE_MS = 2000

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const characterId = params.characterId as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [character, setCharacter] = useState<Character | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [remainingMessages, setRemainingMessages] = useState(APP_CONFIG.DAILY_MESSAGE_LIMIT)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  // 사용자 메시지 배칭용
  const pendingMessagesRef = useRef<string[]>([])
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isApiCallingRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    initMixpanel()

    async function loadData() {
      try {
        const charRes = await fetch('/api/characters')
        const charData = await charRes.json()
        const char = charData.characters.find(
          (c: Character) => c.id === characterId
        )
        setCharacter(char || null)

        const convRes = await fetch(`/api/conversations/${characterId}`)
        const convData = await convRes.json()
        setMessages(convData.messages || [])
        setRemainingMessages(convData.remainingMessages)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setInitialLoading(false)
      }
    }

    loadData()
  }, [characterId])

  // 페이지 이탈 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // AI 응답을 딜레이와 함께 추가
  const addRepliesWithDelay = async (replies: string[]) => {
    setIsTyping(true)

    for (const reply of replies) {
      // 타이핑 시간: 글자당 50ms, 최소 500ms, 최대 2000ms
      const typingTime = Math.min(2000, Math.max(500, reply.length * 50))
      await delay(typingTime)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }])
    }

    setIsTyping(false)
  }

  // API 호출 (배칭된 메시지)
  const sendToAPI = useCallback(async (combinedMessage: string, messageCount: number) => {
    if (isApiCallingRef.current) return
    isApiCallingRef.current = true

    setIsLoading(true)
    track(EVENTS.MESSAGE_SENT, { characterId, messageCount })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, message: combinedMessage }),
      })

      const data = await res.json()

      if (data.error === 'LIMIT_EXCEEDED') {
        setShowLimitModal(true)
        setRemainingMessages(0)
        track(EVENTS.LIMIT_REACHED)
        track(EVENTS.PREMIUM_MODAL_VIEW)
        return
      }

      if (data.replies && data.replies.length > 0) {
        setRemainingMessages(data.remainingMessages)
        setIsLoading(false)
        await addRepliesWithDelay(data.replies)
        track(EVENTS.MESSAGE_RECEIVED, { characterId, replyCount: data.replies.length })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // 에러 시 UI에 추가된 메시지들 롤백 (배칭된 개수만큼)
      setMessages(prev => prev.slice(0, -messageCount))
    } finally {
      setIsLoading(false)
      isApiCallingRef.current = false
    }
  }, [characterId])

  // 메시지 큐 비우기
  const flushMessages = useCallback(() => {
    if (pendingMessagesRef.current.length === 0) return

    const messagesToSend = [...pendingMessagesRef.current]
    const combinedMessage = messagesToSend.join(' ')
    pendingMessagesRef.current = []

    sendToAPI(combinedMessage, messagesToSend.length)
  }, [sendToAPI])

  // 메시지 전송 (디바운스 적용)
  const queueMessage = useCallback((content: string) => {
    if (remainingMessages <= 0) {
      setShowLimitModal(true)
      track(EVENTS.LIMIT_REACHED)
      track(EVENTS.PREMIUM_MODAL_VIEW)
      return
    }

    // UI에 즉시 메시지 추가
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    // 큐에 추가
    pendingMessagesRef.current.push(content)

    // 기존 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 새 타이머 설정
    debounceTimerRef.current = setTimeout(() => {
      flushMessages()
    }, DEBOUNCE_MS)
  }, [remainingMessages, flushMessages])

  // 입력창 blur 시 즉시 전송
  const handleInputBlur = useCallback(() => {
    if (pendingMessagesRef.current.length > 0 && !isApiCallingRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      flushMessages()
    }
  }, [flushMessages])

  // 대화 초기화
  const handleResetConversation = async () => {
    if (!confirm(`${character?.info.name}님과의 대화를 초기화할까요?\n모든 대화 내용이 삭제됩니다.`)) {
      return
    }

    try {
      const res = await fetch(`/api/conversations/${characterId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setMessages([])
        setShowMenu(false)
      }
    } catch (error) {
      console.error('Failed to reset conversation:', error)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
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
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="flex items-center gap-4 p-4 bg-white border-b sticky top-0 z-10">
        <button
          onClick={() => router.push('/chats')}
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

        <img
          src={character.profileImageUrl}
          alt={character.info.name}
          className="w-11 h-11 rounded-full object-cover"
        />

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{character.info.name}</h1>
          <p className="text-sm text-gray-500 truncate">{character.info.job}</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg"
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border z-20">
                <button
                  onClick={handleResetConversation}
                  className="w-full px-4 py-3 text-left text-red-500 hover:bg-red-50 rounded-xl"
                >
                  새롭게 대화 시작하기
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto p-4 space-y-4 ${messages.length > 0 ? 'pb-40' : ''}`}>
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            {character.info.name}님과 대화를 시작해보세요!
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            content={msg.content}
            isUser={msg.role === 'user'}
            characterName={character.info.name}
            characterImage={character.profileImageUrl}
          />
        ))}

        {(isLoading || isTyping) && (
          <TypingIndicator characterImage={character.profileImageUrl} />
        )}

        <div ref={messagesEndRef} />
      </main>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t">
        <ChatInput
          onSend={queueMessage}
          onBlur={handleInputBlur}
          disabled={isLoading && pendingMessagesRef.current.length === 0}
          remainingMessages={remainingMessages}
        />
      </div>

      <FakeDoorModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
    </div>
  )
}
