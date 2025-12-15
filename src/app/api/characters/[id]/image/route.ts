import { NextResponse } from 'next/server'
import { getCharacterImagePath } from '@/lib/characters/loader'
import fs from 'fs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const imagePath = getCharacterImagePath(id)

  if (!imagePath) {
    return new NextResponse('Image not found', { status: 404 })
  }

  const imageBuffer = fs.readFileSync(imagePath)
  const contentType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg'

  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
