import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminDesktopSidebar } from '@/components/layout/admin-desktop-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'FACULTY') redirect('/dashboard')

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#09090B' }}>
      <AdminDesktopSidebar user={session.user} />
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
