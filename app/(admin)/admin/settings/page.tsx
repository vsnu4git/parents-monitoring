'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { FileText, PlusCircle, AlertTriangle, TrendingUp, Shield, LogOut, ChevronRight } from 'lucide-react'

const menuItems = [
  { href: '/admin/notices', label: 'Notices', desc: 'View all notices', icon: FileText, color: '#FAFAFA' },
  { href: '/admin/notices/new', label: 'Publish Notice', desc: 'Create a new notice', icon: PlusCircle, color: '#A1A1AA' },
  { href: '/admin/alerts/new', label: 'Send Alert', desc: 'Send emergency alert', icon: AlertTriangle, color: '#FB923C' },
  { href: '/admin/analytics', label: 'Analytics', desc: 'View reports & trends', icon: TrendingUp, color: '#4ADE80' },
  { href: '/admin/audit', label: 'Audit Logs', desc: 'System activity logs', icon: Shield, color: '#71717A' },
]

export default function AdminSettingsPage() {
  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#09090B' }}>
      <h1 className="text-xl font-bold mb-1" style={{ color: '#FAFAFA' }}>Settings</h1>
      <p className="text-sm mb-6" style={{ color: '#71717A' }}>Admin tools & configuration</p>

      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div
                className="flex items-center gap-3 p-3.5 rounded-2xl transition-colors"
                style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#27272A' }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: '#52525B' }}>{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: '#3F3F46' }} />
              </div>
            </Link>
          )
        })}
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-3 p-3.5 rounded-2xl w-full mt-6 transition-all active:scale-[0.98]"
        style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#1C1517' }}
        >
          <LogOut className="w-5 h-5" style={{ color: '#EF4444' }} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>Sign Out</p>
          <p className="text-xs" style={{ color: '#52525B' }}>Log out of your account</p>
        </div>
      </button>
    </div>
  )
}
