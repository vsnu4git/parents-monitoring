'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, GraduationCap, MessageSquare, Bell,
  FileText, PlusCircle, AlertTriangle, TrendingUp,
  Shield, LogOut, Settings, Calendar,
} from 'lucide-react'

const navSections = [
  {
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/students', label: 'Students', icon: GraduationCap },
      { href: '/admin/tickets', label: 'Tickets', icon: MessageSquare },
    ],
  },
  {
    title: 'Communications',
    items: [
      { href: '/admin/notices', label: 'Notices', icon: FileText },
      { href: '/admin/notices/new', label: 'New Notice', icon: PlusCircle },
      { href: '/admin/alerts', label: 'Alerts', icon: Bell },
      { href: '/admin/alerts/new', label: 'New Alert', icon: AlertTriangle },
    ],
  },
  {
    title: 'Planning',
    items: [
      { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

interface Props {
  user: { name?: string | null; email?: string | null; role: string }
}

export function AdminDesktopSidebar({ user }: Props) {
  const pathname = usePathname()
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 w-56 flex flex-col z-50"
      style={{ backgroundColor: '#0A0A0A', borderRight: '1px solid #27272A' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid #27272A' }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#FAFAFA' }}
        >
          <Shield className="w-5 h-5" style={{ color: '#09090B' }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: '#FAFAFA' }}>PMS</p>
          <p className="text-[10px]" style={{ color: '#52525B' }}>Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="text-[9px] font-bold uppercase tracking-[2px] px-3 mb-2" style={{ color: '#52525B' }}>
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon
                const isActive = ('exact' in item && item.exact)
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                      style={{
                        backgroundColor: isActive ? '#27272A' : 'transparent',
                        color: isActive ? '#FAFAFA' : '#71717A',
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && (
                        <div
                          className="w-1.5 h-1.5 rounded-full ml-auto"
                          style={{ backgroundColor: '#FAFAFA' }}
                        />
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid #27272A' }}>
        <div className="flex items-center gap-3 px-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: '#27272A', color: '#FAFAFA' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#FAFAFA' }}>{user.name}</p>
            <p className="text-[10px] truncate" style={{ color: '#52525B' }}>{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all active:scale-[0.98]"
          style={{ color: '#EF4444' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1C1517')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
