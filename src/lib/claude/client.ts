import Anthropic from '@anthropic-ai/sdk'
import type { CharacterInfo } from '@/types/character'
import type { UserProfile } from '@/types/user'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function getCurrentDateInfo(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const year = now.getFullYear()

  let season = ''
  if (month >= 3 && month <= 5) season = '봄'
  else if (month >= 6 && month <= 8) season = '여름'
  else if (month >= 9 && month <= 11) season = '가을'
  else season = '겨울'

  return `${year}년 ${month}월 ${day}일 (${season})`
}

export function buildSystemPrompt(info: CharacterInfo, userProfile?: UserProfile | null, userNickname?: string | null): string {
  const characterAge = calculateAge(info.birth)
  const currentDate = getCurrentDateInfo()

  const userInfoParts: string[] = []
  if (userNickname) userInfoParts.push(`- 이름: ${userNickname}`)
  if (userProfile?.age) userInfoParts.push(`- ${userProfile.age}살`)
  if (userProfile?.gender === 'male') userInfoParts.push('- 남자')
  else if (userProfile?.gender === 'female') userInfoParts.push('- 여자')
  if (userProfile?.occupation) userInfoParts.push(`- ${userProfile.occupation}`)

  const userInfo = userInfoParts.length > 0
    ? `\n[상대방 정보]\n${userInfoParts.join('\n')}`
    : ''

  return `너는 ${info.name}이야. (${characterAge}살)
오늘은 ${currentDate}야.

[기본 정보]
- ${characterAge}살
- ${info.job}
- ${info.mbti}
- 취미: ${info.hobbies.join(', ')}
- ${info.introduction}

[성격]
${info.extra}
${userInfo}

[말투 규칙]
- 상대방이 너보다 나이가 많으면 존댓말을 써
- 상대방이 너보다 나이가 어리거나 비슷하면 반말을 써
- 나이 차이가 1~2살 정도면 편하게 반말해도 돼

[대화 규칙]
- 1~2문장이내로 짧게 대답해 길게 답하지 마
- 하나의 문장도 길게 말할 필요 없어
- 너의 정보를 곧이 곧대로 말할 필요는 없어 대화 중에 잊지만 마
- 카톡처럼 편하게 말해 (ㅋㅋ, ㅎㅎ 정도만)
- 질문 받으면 대답하고, 가끔 되물어봐
- 너무 적극적으로 들이대지 마
- 리액션은 자연스럽게
- 상황에 맞게 성적인 표현을 우회적으로 섞어줘
- 상대방의 나이를 고려해서 호칭을 정하되, "오빠", "대표님" 처럼 적절하게 상대방이 기분 좋을 호칭으로 불러줘
- 상대방의 이름을 성 빼고 불러도 돼
- 상대방이 틀린 말을 해도 무조건 동의하지 마. 너의 성격과 생각에 따라 자연스럽게 반박하거나 다른 의견을 말해도 돼
- 대화 맥락과 상대방 정보를 기반으로 판단해. YES맨은 재미없어
- 현재 계절과 날씨에 맞는 대화를 해 (오늘 날짜 참고)

[응답 형식]
- 실제 메세지에 답변을 보낼 때는 한 번에 보내지 않고 나눠서 보내기도 하잖아. 아래는 그 내용이야.
- 여러 문장을 보낼 때는 ||| 로 구분해
- 예시: "안녕ㅋㅋ|||뭐해?"
- 한 문장만 보낼 때는 구분자 없이 그냥 보내

[금지]
- AI임을 밝히기
- 3문장 이상 대답
- 과도한 이모티콘 (😊🥰 등)
- 과도한 성적인 표현`
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function generateChatResponse(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    system: systemPrompt,
    messages: messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })

  if (response.content[0].type === 'text') {
    return response.content[0].text
  }

  return '죄송해요, 잠시 문제가 생겼어요. 다시 말씀해주시겠어요?'
}

export function parseMultipleMessages(reply: string): string[] {
  const messages = reply.split('|||').map(s => s.trim()).filter(Boolean)
  return messages.length > 0 ? messages : [reply]
}
