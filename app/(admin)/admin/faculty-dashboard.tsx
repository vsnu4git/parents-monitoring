'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  BookOpen, Users, ClipboardCheck, Clock, Calendar, FileText,
  ChevronRight, AlertTriangle, CheckCircle, Loader2, Bell,
} from 'lucide-react'

interface FacultyDashboardProps {
  session: {
    user: { id: string; name?: string | null; email?: string | null; role: string }
  }
}

interface SubjectInfo {
  id: string; code: string; name: string; semester: number; credits: number
  department: { code: string; name: string }; studentCount: number
}

interface DashboardData {
  faculty: { id: string; department: string; designation: string; user: { name: string } }
  subjects: SubjectInfo[]
  todaysClassesMarked: string[]
  pendingLeaves: number
  totalStudents: number
  isAdmin: boolean
}

interface CalendarEvent {
  id: string; title: string; type: string; startDate: string; endDate: string | null
}

export function FacultyDashboard({ session }: FacultyDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [calRes] = await Promise.all([
          fetch('/api/admin/calendar'),
        ])

        if (calRes.ok) {
          const calData = await calRes.json()
          const upcoming = calData
            .filter((e: CalendarEvent) => new Date(e.startDate) >= new Date(new Date().toDateString()))
            .slice(0, 5)
          setEvents(upcoming)
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const firstName = session.user.name?.split(' ')[0] || 'Faculty'
  const initials = session.user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'FC'

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#09090B' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black" style={{ color: '#FAFAFA' }}>Faculty Portal</h1>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#27272A', color: '#4ADE80' }}
            >
              FACULTY
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#52525B' }}>
            Welcome back, {firstName}. Manage your classes and students.
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#27272A' }}
        >
          <span className="text-base font-bold" style={{ color: '#FAFAFA' }}>{initials}</span>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Attendance', desc: 'Mark attendance', icon: ClipboardCheck, color: '#4ADE80', href: '/admin/attendance' },
          { label: 'Students', desc: 'View students', icon: Users, color: '#FAFAFA', href: '/admin/students' },
          { label: 'Calendar', desc: 'Events & schedule', icon: Calendar, color: '#FB923C', href: '/admin/calendar' },
          { label: 'Notices', desc: 'Announcements', icon: FileText, color: '#A1A1AA', href: '/admin/notices' },
        ].map(action => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href}>
              <div
                className="rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: action.color }} />
                </div>
                <p className="text-sm font-bold" style={{ color: '#FAFAFA' }}>{action.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>{action.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Today's Schedule - 2/3 */}
        <div className="col-span-2 space-y-6">
          {/* Today's Overview */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" style={{ color: '#FAFAFA' }} />
              <p className="text-base font-bold" style={{ color: '#FAFAFA' }}>Today&apos;s Overview</p>
              <span className="text-xs ml-auto" style={{ color: '#52525B' }}>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: '#09090B', border: '1px solid #27272A' }}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4" style={{ color: '#FAFAFA' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#71717A' }}>Classes</span>
                </div>
                <p className="text-2xl font-black" style={{ color: '#FAFAFA' }}>-</p>
                <p className="text-[10px]" style={{ color: '#52525B' }}>Today&apos;s classes</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: '#09090B', border: '1px solid #27272A' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" style={{ color: '#4ADE80' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#71717A' }}>Marked</span>
                </div>
                <p className="text-2xl font-black" style={{ color: '#4ADE80' }}>-</p>
                <p className="text-[10px]" style={{ color: '#52525B' }}>Attendance done</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: '#09090B', border: '1px solid #27272A' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: '#FB923C' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#71717A' }}>Pending</span>
                </div>
                <p className="text-2xl font-black" style={{ color: '#FB923C' }}>-</p>
                <p className="text-[10px]" style={{ color: '#52525B' }}>Leave requests</p>
              </div>
            </div>

            <p className="text-xs mt-4 text-center" style={{ color: '#52525B' }}>
              Use the sidebar to mark attendance, manage students, and review leaves.
            </p>
          </div>

          {/* Upcoming Events */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: '#FB923C' }} />
                <p className="text-base font-bold" style={{ color: '#FAFAFA' }}>Upcoming Events</p>
              </div>
              <Link href="/admin/calendar" className="text-xs flex items-center gap-1" style={{ color: '#A1A1AA' }}>
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#52525B' }} />
              </div>
            ) : events.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: '#52525B' }}>No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {events.map(event => {
                  const typeColor = event.type === 'EXAM' ? '#EF4444' : event.type === 'HOLIDAY' ? '#4ADE80' : '#FAFAFA'
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-3 rounded-xl"
                      style={{ backgroundColor: '#09090B', border: '1px solid #27272A' }}
                    >
                      <div className="text-center flex-shrink-0" style={{ minWidth: 44 }}>
                        <p className="text-lg font-bold" style={{ color: typeColor }}>
                          {format(new Date(event.startDate), 'd')}
                        </p>
                        <p className="text-[9px] font-bold uppercase" style={{ color: '#52525B' }}>
                          {format(new Date(event.startDate), 'MMM')}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#FAFAFA' }}>{event.title}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
                          {event.type}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: '#27272A' }}
              >
                <span className="text-xl font-bold" style={{ color: '#FAFAFA' }}>{initials}</span>
              </div>
              <p className="text-sm font-bold" style={{ color: '#FAFAFA' }}>{session.user.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>{session.user.email}</p>
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: '#4ADE8015', color: '#4ADE80' }}>
                Faculty
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#71717A' }}>Quick Links</p>
            {[
              { label: 'Mark Attendance', href: '/admin/attendance', icon: ClipboardCheck, color: '#4ADE80' },
              { label: 'Leave Requests', href: '/admin/tickets', icon: FileText, color: '#FB923C' },
              { label: 'Send Alert', href: '/admin/alerts/new', icon: Bell, color: '#EF4444' },
              { label: 'Publish Notice', href: '/admin/notices/new', icon: FileText, color: '#FAFAFA' },
              { label: 'Calendar', href: '/admin/calendar', icon: Calendar, color: '#A1A1AA' },
            ].map(link => {
              const Icon = link.icon
              return (
                <Link key={link.label} href={link.href}>
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl mb-1 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    style={{ backgroundColor: '#09090B', border: '1px solid #27272A' }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: link.color }} />
                    <span className="text-xs font-medium" style={{ color: '#FAFAFA' }}>{link.label}</span>
                    <ChevronRight className="w-3 h-3 ml-auto" style={{ color: '#3F3F46' }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl p-3 text-center" style={{ backgroundColor: '#1C1517', border: '1px solid #3F1B1B' }}>
          <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>
        </div>
      )}
    </div>
  )
}
