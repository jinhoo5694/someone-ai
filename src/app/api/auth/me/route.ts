import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const authUser = await getCurrentUser()

    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: user } = await supabase
      .from('users')
      .select('id, username, nickname')
      .eq('id', authUser.userId)
      .single()

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
