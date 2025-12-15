import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Someone 썸원',
  description: '당신의 이야기를 진심으로 들어주는 AI 친구',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
