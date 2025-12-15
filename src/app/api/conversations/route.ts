import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { loadCharacterById } from '@/lib/characters/loader'
import type { Message } from '@/types/chat'

export async function GET() {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: conversations } = await supabase
      .from('conversations')
      .select('character_id, messages, updated_at')
      .eq('user_id', authUser.userId)
      .order('updated_at', { ascending: false })

    const summaries = (conversations || []).map((conv) => {
      const character = loadCharacterById(conv.character_id)
      const messages: Message[] = conv.messages || []
      const lastMessage = messages[messages.length - 1]

      return {
        characterId: conv.character_id,
        characterName: character?.info.name || '알 수 없음',
        characterImage: character?.profileImageUrl || '',
        lastMessage: lastMessage?.content?.slice(0, 50) || '',
        lastMessageTime: lastMessage?.timestamp || conv.updated_at,
        updatedAt: conv.updated_at,
      }
    })

    return NextResponse.json({ conversations: summaries })
  } catch (error) {
    console.error('Conversations list API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
