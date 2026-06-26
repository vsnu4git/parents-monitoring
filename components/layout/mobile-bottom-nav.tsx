'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Eye, Brain, CreditCard, Menu } from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/monitor', label: 'Monitor', icon: Eye, match: (p: string) => p.startsWith('/dashboard/monitor') },
  { href: '/dashboard/insights', label: 'Insights', icon: Brain, match: (p: string) => p.startsWith('/dashboard/insights') },
  { href: '/dashboard/fees', label: 'Fees', icon: CreditCard, match: (p: string) => p.startsWith('/dashboard/fees') },
  { href: '/dashboard/more', label: 'More', icon: Menu, match: (p: string) => ['/dashboard/tickets', '/dashboard/notifications', '/dashboard/notices', '/dashboard/leave', '/dashboard/profile', '/dashboard/more', '/dashboard/academics', '/dashboard/attendance', '/dashboard/sos', '/dashboard/controls', '/dashboard/report', '/dashboard/calendar', '/dashboard/student-profile'].some(x => p.startsWith(x)) },
]

export function MobileBottomNav() {
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
