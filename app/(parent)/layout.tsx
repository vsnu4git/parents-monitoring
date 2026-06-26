import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN' || session.user.role === 'FACULTY') redirect('/admin')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      {/* Leaflet CSS for map on monitoring page */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <main className="pb-20 min-h-screen">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
