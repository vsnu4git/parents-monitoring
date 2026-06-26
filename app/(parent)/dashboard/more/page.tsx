'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { MessageSquare, MapPin, Wallet, UtensilsCrossed, Bell, FileText, Calendar, User, LogOut, ChevronRight, BookOpen, ShieldAlert, Sliders, ClipboardList } from 'lucide-react'

const menuItems = [
  { href: '/dashboard/sos', label: 'SOS Emergency', desc: 'Emergency alerts & panic', icon: ShieldAlert, accent: '#EF4444' },
  { href: '/dashboard/controls', label: 'Parent Controls', desc: 'Set limits & alerts', icon: Sliders, accent: 'var(--pms-brown)' },
  { href: '/dashboard/report', label: 'Weekly Report', desc: 'Digest & summary', icon: ClipboardList, accent: 'var(--pms-brown)' },
  { href: '/dashboard/academics', label: 'Academics', desc: 'Marks & performance', icon: BookOpen, accent: 'var(--pms-brown)' },
  { href: '/dashboard/attendance', label: 'Attendance', desc: 'Attendance records', icon: Calendar, accent: 'var(--pms-brown)' },
  { href: '/dashboard/tickets', label: 'Tickets', desc: 'Support tickets', icon: MessageSquare, accent: 'var(--pms-brown)' },
  { href: '/dashboard/monitor/od-tracker', label: 'OD Tracker', desc: 'Track OD trips', icon: MapPin, accent: 'var(--pms-brown)' },
  { href: '/dashboard/monitor/expenses', label: 'Expenses', desc: 'CampusOne spending', icon: Wallet, accent: 'var(--pms-brown)' },
  { href: '/dashboard/monitor/food', label: 'Food Log', desc: 'Daily meals', icon: UtensilsCrossed, accent: 'var(--pms-brown)' },
  { href: '/dashboard/notifications', label: 'Notifications', desc: 'Alerts & updates', icon: Bell, accent: 'var(--pms-brown)' },
  { href: '/dashboard/notices', label: 'Notices', desc: 'College announcements', icon: FileText, accent: 'var(--pms-brown)' },
  { href: '/dashboard/calendar', label: 'Calendar', desc: 'Events & timetable', icon: Calendar, accent: 'var(--pms-brown)' },
  { href: '/dashboard/leave', label: 'Leave & OD', desc: 'Leave records', icon: Calendar, accent: 'var(--pms-brown)' },
  { href: '/dashboard/profile', label: 'Profile', desc: 'Account info', icon: User, accent: 'var(--pms-brown)' },
]

export default function MorePage() {
  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--pms-text)' }}>More</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--pms-text-sec)' }}>Settings & additional features</p>

      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-3.5 rounded-2xl active:scale-[0.98] transition-all duration-150 block"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--pms-bg)' }}
              >
                <Icon className="w-5 h-5" style={{ color: item.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pms-text-muted)' }} />
            </Link>
          )
        })}
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-3 p-3.5 rounded-2xl w-full mt-6 active:scale-[0.98] transition-all duration-150"
        style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#EF44441A' }}
        >
          <LogOut className="w-5 h-5 text-[#EF4444]" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-[#EF4444]">Sign Out</p>
          <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Log out of your account</p>
        </div>
      </button>
    </div>
  )
}
