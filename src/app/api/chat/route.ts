import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { loadCharacterById } from '@/lib/characters/loader'
import { buildSystemPrompt, generateChatResponse, parseMultipleMessages } from '@/lib/claude/client'
import { APP_CONFIG } from '@/lib/config/constants'
import type { Message } from '@/types/chat'
import type { UserProfile } from '@/types/user'

const { DAILY_MESSAGE_LIMIT } = APP_CONFIG

export async function POST(request: Request) {
  try {
    // JWT 인증 확인
    const authUser = await getCurrentUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { characterId, message } = await request.json()

    if (!characterId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const userId = authUser.userId
    const today = new Date().toISOString().split('T')[0]

    const supabase = createAdminClient()

    // 0. 슈퍼 계정 여부 확인
    const { data: userInfo } = await supabase
      .from('users')
      .select('is_super')
      .eq('id', userId)
      .single()

    const isSuper = userInfo?.is_super || false

    // 1. 일일 사용량 확인 (슈퍼 계정은 제한 없음)
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('message_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    const currentCount = usage?.message_count || 0

    if (!isSuper && currentCount >= DAILY_MESSAGE_LIMIT) {
      return NextResponse.json(
        {
          error: 'LIMIT_EXCEEDED',
          remainingMessages: 0,
        },
        { status: 429 }
      )
    }

    // 2. 캐릭터 정보 로드
    const character = loadCharacterById(characterId)
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    // 2.5. 사용자 프로필 및 닉네임 조회
    const { data: userData } = await supabase
      .from('users')
      .select('profile, nickname')
      .eq('id', userId)
      .single()

    const userProfile: UserProfile | null = userData?.profile || null
    const userNickname: string | null = userData?.nickname || null

    // 3. 기존 대화 내역 조회
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id, messages')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single()

    // 새 대화 생성 (없는 경우)
    if (!conversation) {
      const { data: newConv, error: insertError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          character_id: characterId,
          messages: [],
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create conversation:', insertError)
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }

      conversation = newConv
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Failed to get conversation' },
        { status: 500 }
      )
    }

    const existingMessages: Message[] = conversation.messages || []

    // 4. Claude API 호출
    const systemPrompt = buildSystemPrompt(character.info, userProfile, userNickname)
    const chatMessages = existingMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))
    chatMessages.push({ role: 'user' as const, content: message })

    const rawReply = await generateChatResponse(systemPrompt, chatMessages)
    const replies = parseMultipleMessages(rawReply)

    // 5. 대화 저장 (분리된 메시지 각각 저장)
    const now = new Date()
    const newMessages: Message[] = [
      ...existingMessages,
      { role: 'user', content: message, timestamp: now.toISOString() },
    ]

    // 각 응답 메시지를 약간의 시간차로 저장 (히스토리 순서 보장)
    replies.forEach((replyContent, index) => {
      const replyTime = new Date(now.getTime() + (index + 1) * 100)
      newMessages.push({
        role: 'assistant',
        content: replyContent,
        timestamp: replyTime.toISOString(),
      })
    })

    await supabase
      .from('conversations')
      .update({
        messages: newMessages,
        message_count: newMessages.length,
        updated_at: now.toISOString(),
      })
      .eq('id', conversation.id)

    // 6. 일일 사용량 업데이트
    await supabase.from('daily_usage').upsert(
      {
        user_id: userId,
        date: today,
        message_count: currentCount + 1,
      },
      { onConflict: 'user_id,date' }
    )

    return NextResponse.json({
      replies,
      remainingMessages: isSuper ? -1 : DAILY_MESSAGE_LIMIT - currentCount - 1,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
