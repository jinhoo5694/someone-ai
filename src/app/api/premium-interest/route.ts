import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/jwt'

export async function POST() {
  try {
    // JWT 인증 확인
    const authUser = await getCurrentUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // 현재 클릭 수 조회
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('premium_clicks')
      .eq('user_id', authUser.userId)
      .eq('date', today)
      .single()

    const currentClicks = usage?.premium_clicks || 0

    // premium_clicks 업데이트
    await supabase.from('daily_usage').upsert(
      {
        user_id: authUser.userId,
        date: today,
        premium_clicks: currentClicks + 1,
      },
      { onConflict: 'user_id,date' }
    )

    return NextResponse.json({ recorded: true })
  } catch (error) {
    console.error('Premium interest API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
