import { getStudentSession } from '@/lib/student-auth'
import { redirect } from 'next/navigation'
import { StudentBottomNav } from './student-bottom-nav'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getStudentSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      <main className="pb-28 min-h-screen">
        {children}
      </main>
      <StudentBottomNav />
    </div>
  )
}
