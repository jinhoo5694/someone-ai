'use client'

interface TypingIndicatorProps {
  characterImage?: string
}

export function TypingIndicator({ characterImage }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 items-end">
      {characterImage && (
        <img
          src={characterImage}
          alt=""
          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
        />
      )}
      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
