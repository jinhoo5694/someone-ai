export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  user_id: string
  character_id: string
  messages: Message[]
  message_count: number
  created_at: string
  updated_at: string
}

export interface DailyUsage {
  user_id: string
  date: string
  message_count: number
  premium_clicks: number
}
