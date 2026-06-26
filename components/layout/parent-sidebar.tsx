'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, ClipboardList, CreditCard,
  Calendar, Bell, MessageSquare, FileText, User, GraduationCap
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/attendance', label: 'Attendance', icon: ClipboardList },
  { href: '/dashboard/academics', label: 'Academics', icon: BookOpen },
  { href: '/dashboard/fees', label: 'Fee Status', icon: CreditCard },
  { href: '/dashboard/leave', label: 'Leave & OD', icon: Calendar },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/notices', label: 'Notices', icon: FileText },
  { href: '/dashboard/tickets', label: 'Support', icon: MessageSquare },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

export function ParentSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64"
        style={{
          backgroundColor: 'var(--pms-bg)',
          borderRight: '1px solid var(--pms-border)',
        }}
      >
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid var(--pms-border)' }}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ backgroundColor: 'var(--pms-text)' }}
          >
            <GraduationCap className="w-5 h-5" style={{ color: 'var(--pms-bg)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Parent Portal</p>
            <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>MEC</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98]',
                )}
                style={{
                  backgroundColor: isActive ? 'var(--pms-text)' : 'transparent',
                  color: isActive ? 'var(--pms-bg)' : 'var(--pms-text-sec)',
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: isActive ? 'var(--pms-bg)' : 'var(--pms-text-muted)' }}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
