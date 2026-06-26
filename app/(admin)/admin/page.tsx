import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GraduationCap, Users, MessageSquare, Bell, CreditCard, AlertTriangle, BookOpen, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { FeeStatus, TicketStatus } from '@prisma/client'
import { format } from 'date-fns'
import { TicketPieChart, FeeBarChart } from './admin-charts'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Faculty gets their own dashboard
  if (session.user.role === 'FACULTY') {
    const { FacultyDashboard } = await import('./faculty-dashboard')
    return <FacultyDashboard session={session} />
  }

  try {
    const [
      totalStudents, totalParents, openTickets, activeAlerts,
      overdueFeesCount, lowAttendanceCount, recentTickets,
      unreadNotificationsCount, ticketsByStatus, feesByStatus,
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.parent.count(),
      prisma.ticket.count({ where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } } }),
      prisma.emergencyAlert.count({ where: { isActive: true } }),
      prisma.feeRecord.count({ where: { status: FeeStatus.OVERDUE } }),
      (async () => {
        const students = await prisma.student.findMany({
          where: { status: 'ACTIVE' },
          include: { attendanceRecords: true }
        })
        let count = 0
        for (const s of students) {
          const total = s.attendanceRecords.length
          const present = s.attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'OD').length
          if (total > 0 && (present / total) * 100 < 75) count++
        }
        return count
      })(),
      prisma.ticket.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { parent: { include: { user: true } }, student: true }
      }),
      prisma.notification.count({ where: { isRead: false } }),
      Promise.all([
        prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
        prisma.ticket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
        prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
        prisma.ticket.count({ where: { status: TicketStatus.CLOSED } }),
      ]),
      Promise.all([
        prisma.feeRecord.count({ where: { status: FeeStatus.PAID } }),
        prisma.feeRecord.count({ where: { status: FeeStatus.PENDING } }),
        prisma.feeRecord.count({ where: { status: FeeStatus.OVERDUE } }),
      ]),
    ])

    const [ticketOpen, ticketInProgress, ticketResolved, ticketClosed] = ticketsByStatus
    const [feePaid, feePending, feeOverdue] = feesByStatus
    const initials = session.user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'

    const stats = [
      { label: 'Active Students', value: totalStudents, icon: GraduationCap, color: '#FAFAFA', href: '/admin/students' },
      { label: 'Linked Parents', value: totalParents, icon: Users, color: '#A1A1AA', href: '/admin/students' },
      { label: 'Open Tickets', value: openTickets, icon: MessageSquare, color: '#FB923C', href: '/admin/tickets' },
      { label: 'Active Alerts', value: activeAlerts, icon: Bell, color: '#EF4444', href: '/admin/alerts' },
      { label: 'Overdue Fees', value: overdueFeesCount, icon: CreditCard, color: '#EF4444', href: '#' },
      { label: 'Low Attendance', value: lowAttendanceCount, icon: AlertTriangle, color: '#FB923C', href: '#' },
    ]

    const quickActions = [
      { label: 'Send Emergency Alert', href: '/admin/alerts/new', icon: Bell, color: '#EF4444' },
      { label: 'Publish Notice', href: '/admin/notices/new', icon: BookOpen, color: '#FAFAFA' },
      { label: 'Review Tickets', href: '/admin/tickets', icon: MessageSquare, color: '#FB923C' },
      { label: 'Manage Students', href: '/admin/students', icon: GraduationCap, color: '#A1A1AA' },
    ]

    return (
      <div className="p-8 min-h-screen" style={{ backgroundColor: '#09090B' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black" style={{ color: '#FAFAFA' }}>Dashboard</h1>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#27272A', color: '#FAFAFA' }}
              >
                {session.user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : (session.user.role as string) === 'FACULTY' ? 'FACULTY' : 'ADMIN'}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: '#52525B' }}>
              Welcome back, {session.user.name?.split(' ')[0]}. Here&apos;s your institution overview.
            </p>
          </div>
        </div>

        {/* Stats Row - 6 cards */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href}>
                <div
                  className="rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <p className="text-3xl font-black" style={{ color: '#FAFAFA' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#71717A' }}>{stat.label}</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Charts Row - side by side */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <TicketPieChart open={ticketOpen} inProgress={ticketInProgress} resolved={ticketResolved} closed={ticketClosed} />
          <FeeBarChart paid={feePaid} pending={feePending} overdue={feeOverdue} />
        </div>

        {/* Bottom Row: Recent Tickets + Quick Actions */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent Tickets - 2/3 */}
          <div
            className="col-span-2 rounded-2xl p-6"
            style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold" style={{ color: '#FAFAFA' }}>Recent Tickets</p>
              <Link
                href="/admin/tickets"
                className="text-xs font-medium flex items-center gap-1 hover:underline"
                style={{ color: '#A1A1AA' }}
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {recentTickets.length === 0 ? (
              <p className="text-center py-8" style={{ color: '#52525B' }}>No tickets yet</p>
            ) : (
              <div className="space-y-2">
                {recentTickets.map(t => {
                  const statusColor = t.status === 'OPEN' ? '#FB923C' : t.status === 'IN_PROGRESS' ? '#60A5FA' : t.status === 'RESOLVED' ? '#4ADE80' : '#52525B'
                  return (
                    <Link key={t.id} href={`/admin/tickets`}>
                      <div
                        className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.005] cursor-pointer"
                        style={{ backgroundColor: '#09090B', border: '1px solid #27272A' }}
                      >
                        <div
                          className="w-2 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: statusColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#FAFAFA' }}>{t.subject}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                            {t.parent.user.name} &middot; {t.student.name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                          <p className="text-[10px] mt-1" style={{ color: '#52525B' }}>
                            {format(new Date(t.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Actions - 1/3 */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
          >
            <p className="text-base font-bold mb-4" style={{ color: '#FAFAFA' }}>Quick Actions</p>
            <div className="space-y-2">
              {quickActions.map(action => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href}>
                    <div
                      className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      style={{ backgroundColor: '#09090B', border: '1px solid #27272A' }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${action.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: action.color }} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: '#FAFAFA' }}>{action.label}</span>
                      <ChevronRight className="w-4 h-4 ml-auto" style={{ color: '#3F3F46' }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Admin dashboard error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return (
      <div className="p-8 min-h-screen" style={{ backgroundColor: '#09090B' }}>
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#FAFAFA' }}>Admin Dashboard</h1>
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
          <p className="text-sm mb-2" style={{ color: '#EF4444' }}>Failed to load dashboard</p>
          <p className="text-xs" style={{ color: '#71717A' }}>{errorMsg}</p>
          <p className="text-xs mt-4" style={{ color: '#52525B' }}>
            Check your database connection and ensure migrations are up to date.
          </p>
        </div>
      </div>
    )
  }
}
