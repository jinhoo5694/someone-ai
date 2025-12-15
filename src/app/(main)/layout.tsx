import { TabNavigation } from '@/components/layout/TabNavigation'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pb-20">
      {children}
      <TabNavigation />
    </div>
  )
}
