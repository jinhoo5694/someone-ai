import { NextResponse } from 'next/server'
import { loadAllCharacters } from '@/lib/characters/loader'

export async function GET() {
  const characters = loadAllCharacters()
  return NextResponse.json({ characters })
}
