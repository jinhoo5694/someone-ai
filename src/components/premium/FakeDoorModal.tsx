'use client'

import { track, EVENTS } from '@/lib/mixpanel/client'

interface FakeDoorModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FakeDoorModal({ isOpen, onClose }: FakeDoorModalProps) {
  const handlePremiumClick = async () => {
    track(EVENTS.PREMIUM_BUTTON_CLICK)

    // API 호출로 클릭 기록
    try {
      await fetch('/api/premium-interest', { method: 'POST' })
    } catch (error) {
      console.error('Failed to record premium interest:', error)
    }

    // 감사 메시지로 변경
    alert('관심 가져주셔서 감사합니다!\n곧 프리미엄 서비스가 오픈됩니다.')
    onClose()
  }

  const handleDismiss = () => {
    track(EVENTS.PREMIUM_MODAL_DISMISS)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">💬</div>

        <h2 className="text-2xl font-bold mb-3">
          오늘의 무료 메시지를
          <br />다 사용했어요
        </h2>

        <p className="text-gray-600 text-lg mb-6">
          내일 다시 15개의 메시지가 충전됩니다
        </p>

        <button
          onClick={handlePremiumClick}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500
                     text-white py-4 rounded-xl text-xl font-bold mb-4
                     active:scale-[0.98] transition-transform"
        >
          💎 프리미엄 잠금해제
          <span className="block text-base font-normal mt-1">월 9,900원</span>
        </button>

        <button
          onClick={handleDismiss}
          className="text-gray-500 text-lg py-2 hover:text-gray-700"
        >
          내일 다시 올게요
        </button>
      </div>
    </div>
  )
}
