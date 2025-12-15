'use client'

import mixpanel from 'mixpanel-browser'

let initialized = false

export function initMixpanel() {
  if (initialized || typeof window === 'undefined') return

  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token) {
    console.warn('Mixpanel token not found')
    return
  }

  mixpanel.init(token, {
    track_pageview: true,
    persistence: 'localStorage',
  })

  initialized = true
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return
  mixpanel.track(event, properties)
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!initialized) return
  mixpanel.identify(userId)
  if (traits) {
    mixpanel.people.set(traits)
  }
}

// 이벤트 상수
export const EVENTS = {
  // 인증
  LOGIN_START: 'login_start',
  LOGIN_SUCCESS: 'login_success',

  // 캐릭터
  CHARACTER_VIEW: 'character_view',
  CHARACTER_SELECT: 'character_select',

  // 채팅
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',

  // Fake Door
  LIMIT_REACHED: 'limit_reached',
  PREMIUM_MODAL_VIEW: 'premium_modal_view',
  PREMIUM_BUTTON_CLICK: 'premium_button_click',
  PREMIUM_MODAL_DISMISS: 'premium_modal_dismiss',
} as const
