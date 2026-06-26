'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, CreditCard,
  Bell, FileText, MessageSquare, BarChart3, Shield, GraduationCap, Megaphone
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students & Parents', icon: Users },
  { href: '/admin/attendance', label: 'Attendance', icon: ClipboardList },
  { href: '/admin/academics', label: 'Academics', icon: BookOpen },
  { href: '/admin/fees', label: 'Fee Management', icon: CreditCard },
  { href: '/admin/notices', label: 'Notices', icon: FileText },
  { href: '/admin/alerts', label: 'Emergency Alerts', icon: Megaphone },
  { href: '/admin/tickets', label: 'Support Tickets', icon: MessageSquare },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/audit', label: 'Audit Logs', icon: Shield },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64"
      style={{ backgroundColor: '#09090B' }}
    >
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: '1px solid #27272A' }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ backgroundColor: '#FAFAFA' }}
        >
          <GraduationCap className="w-5 h-5" style={{ color: '#09090B' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Admin Panel</p>
          <p className="text-xs" style={{ color: '#52525B' }}>MEC</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98]',
              )}
              style={{
                backgroundColor: isActive ? '#FAFAFA' : 'transparent',
                color: isActive ? '#09090B' : '#A1A1AA',
              }}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? '#09090B' : '#52525B' }}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
