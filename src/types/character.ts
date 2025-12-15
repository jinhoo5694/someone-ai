export interface CharacterInfo {
  name: string
  introduction: string
  height: string
  weight: string
  birth: string
  job: string
  mbti: string
  hobbies: string[]
  extra: string
}

export interface Character {
  id: string
  info: CharacterInfo
  profileImageUrl: string
}

export interface CharacterMeta {
  version: string
  members: { dir: string }[]
}
