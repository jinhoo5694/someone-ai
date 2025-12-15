import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { APP_CONFIG } from '@/lib/config/constants'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params

    // JWT 인증 확인
    const authUser = await getCurrentUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // 슈퍼 계정 여부 확인
    const { data: userInfo } = await supabase
      .from('users')
      .select('is_super')
      .eq('id', authUser.userId)
      .single()

    const isSuper = userInfo?.is_super || false

    // 대화 내역 조회
    const { data: conversation } = await supabase
      .from('conversations')
      .select('messages')
      .eq('user_id', authUser.userId)
      .eq('character_id', characterId)
      .single()

    // 일일 사용량 조회
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('message_count')
      .eq('user_id', authUser.userId)
      .eq('date', today)
      .single()

    const currentCount = usage?.message_count || 0

    return NextResponse.json({
      messages: conversation?.messages || [],
      remainingMessages: isSuper ? -1 : APP_CONFIG.DAILY_MESSAGE_LIMIT - currentCount,
    })
  } catch (error) {
    console.error('Conversations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 대화 초기화 (메시지 삭제)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params

    const authUser = await getCurrentUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // 대화 내용을 빈 배열로 초기화
    const { error } = await supabase
      .from('conversations')
      .update({
        messages: [],
        message_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', authUser.userId)
      .eq('character_id', characterId)

    if (error) {
      console.error('Failed to reset conversation:', error)
      return NextResponse.json(
        { error: 'Failed to reset conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Conversation reset API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
