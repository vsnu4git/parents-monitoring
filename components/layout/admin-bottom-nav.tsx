'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, GraduationCap, MessageSquare, Bell, Settings } from 'lucide-react'

const tabs = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/admin' },
  { href: '/admin/students', label: 'Students', icon: GraduationCap, match: (p: string) => p.startsWith('/admin/students') },
  { href: '/admin/tickets', label: 'Tickets', icon: MessageSquare, match: (p: string) => p.startsWith('/admin/tickets') },
  { href: '/admin/alerts', label: 'Alerts', icon: Bell, match: (p: string) => p.startsWith('/admin/alerts') || p.startsWith('/admin/notices') },
  { href: '/admin/settings', label: 'Settings', icon: Settings, match: (p: string) => p.startsWith('/admin/settings') || p.startsWith('/admin/analytics') || p.startsWith('/admin/audit') },
]

export function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(9, 9, 11, 0.85)',
        borderTop: '1px solid #27272A',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative',
                isActive ? 'text-[#FAFAFA]' : 'text-[#52525B]'
              )}
            >
              {isActive && (
                <div
                  className="absolute top-2 w-10 h-7 rounded-full"
                  style={{ backgroundColor: '#27272A' }}
                />
              )}
              <Icon className={cn('w-5 h-5 relative z-10', isActive && 'stroke-[2.5px]')} />
              <span className={cn('text-[10px] font-medium relative z-10', isActive && 'font-semibold')}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
