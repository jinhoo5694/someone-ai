'use client'

interface MessageBubbleProps {
  content: string
  isUser: boolean
  characterName?: string
  characterImage?: string
}

export function MessageBubble({
  content,
  isUser,
  characterName,
  characterImage,
}: MessageBubbleProps) {
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && characterImage && (
        <img
          src={characterImage}
          alt={characterName}
          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
        />
      )}

      <div
        className={`
        max-w-[75%] px-4 py-3 rounded-2xl text-lg leading-relaxed
        ${
          isUser
            ? 'bg-primary-500 text-white rounded-tr-sm'
            : 'bg-white text-gray-900 rounded-tl-sm shadow-sm'
        }
      `}
      >
        {content}
      </div>
    </div>
  )
}
