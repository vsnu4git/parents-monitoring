'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, BarChart3, Calendar, User } from 'lucide-react'

const tabs = [
  { href: '/student', label: 'Home', icon: LayoutDashboard, match: (p: string) => p === '/student' },
  { href: '/student/academics', label: 'Academics', icon: BookOpen, match: (p: string) => p.startsWith('/student/academics') },
  { href: '/student/attendance', label: 'Attendance', icon: BarChart3, match: (p: string) => p.startsWith('/student/attendance') },
  { href: '/student/calendar', label: 'Calendar', icon: Calendar, match: (p: string) => p.startsWith('/student/calendar') },
  { href: '/student/profile', label: 'Profile', icon: User, match: (p: string) => p.startsWith('/student/profile') || p.startsWith('/student/fees') || p.startsWith('/student/notices') },
]

export function StudentBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--pms-bg) 85%, transparent)',
        borderTop: '1px solid var(--pms-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150"
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150"
                style={{
                  backgroundColor: isActive ? 'var(--pms-text)' : 'transparent',
                }}
              >
                <Icon
                  className="w-[18px] h-[18px]"
                  style={{
                    color: isActive ? 'var(--pms-bg)' : 'var(--pms-text-muted)',
                    strokeWidth: isActive ? 2.5 : 1.75,
                  }}
                />
              </div>
              <span
                className="text-[9px] font-medium"
                style={{ color: isActive ? 'var(--pms-text)' : 'var(--pms-text-muted)' }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
