import fs from 'fs'
import path from 'path'
import type { Character, CharacterInfo, CharacterMeta } from '@/types/character'

const CHARACTERS_DIR = path.join(process.cwd(), 'characters')

export function loadAllCharacters(): Character[] {
  try {
    const metaPath = path.join(CHARACTERS_DIR, 'meta.json')
    const metaContent = fs.readFileSync(metaPath, 'utf-8')
    const meta: CharacterMeta = JSON.parse(metaContent)

    const characters: Character[] = meta.members.map((member) => {
      const infoPath = path.join(CHARACTERS_DIR, member.dir, 'info.json')
      const infoContent = fs.readFileSync(infoPath, 'utf-8')
      const info: CharacterInfo = JSON.parse(infoContent)

      return {
        id: member.dir,
        info,
        profileImageUrl: `/api/characters/${member.dir}/image`,
      }
    })

    return characters
  } catch (error) {
    console.error('Failed to load characters:', error)
    return []
  }
}

export function loadCharacterById(id: string): Character | null {
  try {
    const metaPath = path.join(CHARACTERS_DIR, 'meta.json')
    const metaContent = fs.readFileSync(metaPath, 'utf-8')
    const meta: CharacterMeta = JSON.parse(metaContent)

    const member = meta.members.find((m) => m.dir === id)
    if (!member) return null

    const infoPath = path.join(CHARACTERS_DIR, member.dir, 'info.json')
    const infoContent = fs.readFileSync(infoPath, 'utf-8')
    const info: CharacterInfo = JSON.parse(infoContent)

    return {
      id: member.dir,
      info,
      profileImageUrl: `/api/characters/${member.dir}/image`,
    }
  } catch (error) {
    console.error('Failed to load character:', error)
    return null
  }
}

export function getCharacterImagePath(id: string): string | null {
  const imagePath = path.join(CHARACTERS_DIR, id, 'profile.png')
  if (fs.existsSync(imagePath)) {
    return imagePath
  }

  // jpg 형식도 확인
  const jpgPath = path.join(CHARACTERS_DIR, id, 'profile.jpg')
  if (fs.existsSync(jpgPath)) {
    return jpgPath
  }

  return null
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}
