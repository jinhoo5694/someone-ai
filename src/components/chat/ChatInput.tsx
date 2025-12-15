'use client'

import { useState, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  onBlur?: () => void
  disabled?: boolean
  remainingMessages: number
}

export function ChatInput({
  onSend,
  onBlur,
  disabled,
  remainingMessages,
}: ChatInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim())
      setText('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-4 border-t bg-white">
      {/* 잔여 메시지 표시 */}
      <div className="text-sm text-gray-500 mb-3 text-center">
        오늘 남은 메시지:{' '}
        <span className="font-bold text-primary-500">{remainingMessages}개</span>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          onBlur={onBlur}
          placeholder="메시지를 입력하세요..."
          className="flex-1 px-4 py-3 text-lg border-2 border-gray-200 rounded-xl
                     focus:border-primary-500 focus:outline-none
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="px-6 py-3 bg-primary-500 text-white text-lg font-bold
                     rounded-xl min-w-[80px] disabled:bg-gray-300
                     active:scale-[0.98] transition-transform"
        >
          전송
        </button>
      </div>
    </div>
  )
}
