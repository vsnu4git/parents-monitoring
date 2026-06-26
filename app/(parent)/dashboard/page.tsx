import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AttendanceStatus, FeeStatus, AlertSeverity } from '@prisma/client'
import {
  AlertTriangle, CreditCard, BookOpen, Bell, Megaphone,
  ChevronRight, GraduationCap, Activity, Calendar, TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  AttendanceDonut,
  FeeMiniBar,
  ScoreSparkline,
  AttendanceTrendChart,
  SubjectPerformanceChart,
} from '@/components/dashboard-charts'
import { ThemeToggle } from '@/components/theme-toggle'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { DashboardStudentSelector } from './dashboard-student-selector'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        students: { include: { department: true } }
      }
    })

    if (!parent || parent.students.length === 0) {
      const firstName = session.user.name?.split(' ')[0] || 'there'
      return (
        <div className="px-5 pt-6 pb-8 space-y-5" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>
            Hello, {firstName}
          </h1>
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--pms-card-alt)' }}>
                <GraduationCap className="w-6 h-6" style={{ color: 'var(--pms-text-muted)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--pms-text-sec)' }}>No student linked yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--pms-text-muted)' }}>Contact college administration</p>
            </div>
          </div>
        </div>
      )
    }

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)

    const [
      attendanceRecords,
      markRecords,
      feeRecords,
      notifications,
      emergencyAlerts,
      upcomingEvents,
    ] = await Promise.all([
      prisma.attendanceRecord.findMany({ where: { studentId: student.id }, include: { subject: true } }),
      prisma.markRecord.findMany({ where: { studentId: student.id }, include: { subject: true }, orderBy: { publishedAt: 'desc' }, take: 20 }),
      prisma.feeRecord.findMany({ where: { studentId: student.id }, orderBy: { dueDate: 'desc' } }),
      prisma.notification.findMany({
        where: { OR: [{ studentId: student.id }, { targetRole: 'PARENT', studentId: null }] },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.emergencyAlert.findMany({ where: { isActive: true }, orderBy: { publishedAt: 'desc' } }),
      prisma.calendarEvent.findMany({ where: { startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, take: 5 }),
    ])

    const totalClasses = attendanceRecords.length
    const presentClasses = attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length
    const attendancePercent = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
    const isAttendanceLow = attendancePercent < 75

    const pendingFees = feeRecords.filter(f => f.status === FeeStatus.PENDING || f.status === FeeStatus.PARTIAL || f.status === FeeStatus.OVERDUE)
    const totalDue = pendingFees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0)
    const totalFeeAmount = feeRecords.reduce((sum, f) => sum + f.totalAmount, 0)
    const totalPaid = feeRecords.reduce((sum, f) => sum + f.paidAmount, 0)

    const recentMarks = markRecords.slice(0, 10)
    const avgScore = recentMarks.length > 0
      ? Math.round(recentMarks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / recentMarks.length)
      : 0

    const unreadNotifications = notifications.filter(n => !n.isRead).length
    const firstName = parent.user.name?.split(' ')[0] || 'there'
    const initials = parent.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'

    const sparklineData = [...recentMarks]
      .reverse()
      .map(m => ({
        name: m.subject.code,
        value: Math.round((m.score / m.maxScore) * 100),
      }))

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentAttendance = attendanceRecords.filter(r => new Date(r.date) >= thirtyDaysAgo)
    const dateMap = new Map<string, { total: number; present: number }>()
    for (const r of recentAttendance) {
      const key = format(new Date(r.date), 'MMM d')
      const entry = dateMap.get(key) || { total: 0, present: 0 }
      entry.total++
      if (r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD) {
        entry.present++
      }
      dateMap.set(key, entry)
    }
    const attendanceTrendData = Array.from(dateMap.entries())
      .map(([date, { total, present }]) => ({
        date,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      }))

    const subjectMap = new Map<string, { total: number; count: number; name: string }>()
    for (const m of markRecords) {
      const entry = subjectMap.get(m.subjectId) || { total: 0, count: 0, name: m.subject.name }
      entry.total += (m.score / m.maxScore) * 100
      entry.count++
      subjectMap.set(m.subjectId, entry)
    }
    const subjectPerformanceData = Array.from(subjectMap.values())
      .map(({ name, total, count }) => ({
        subject: name.length > 12 ? name.slice(0, 12) + '..' : name,
        score: Math.round(total / count),
      }))
      .sort((a, b) => b.score - a.score)

    return (
      <div className="px-5 pt-5 pb-8 space-y-5" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--pms-text)' }}>
              Hi, {firstName}
            </h1>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--pms-text-muted)' }}>
              {format(new Date(), 'EEEE, MMM d')}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <ThemeToggle />
            <Link href="/dashboard/notifications" className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150"
                style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
              >
                <Bell className="w-4 h-4" style={{ color: 'var(--pms-text-sec)' }} />
              </div>
              {unreadNotifications > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ backgroundColor: '#EF4444', color: '#FFF' }}
                >
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
            <Link href="/dashboard/profile">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150"
                style={{ backgroundColor: 'var(--pms-text)', color: 'var(--pms-bg)' }}
              >
                <span className="text-xs font-bold">{initials}</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Student Selector ── */}
        {parent.students.length > 1 && (
          <DashboardStudentSelector
            students={JSON.parse(JSON.stringify(parent.students))}
            selectedId={student.id}
          />
        )}

        {/* ── Emergency Alerts ── */}
        {emergencyAlerts.length > 0 && (
          <div className="space-y-2.5">
            {emergencyAlerts.map(alert => {
              const isCritical = alert.severity === AlertSeverity.CRITICAL
              return (
                <div
                  key={alert.id}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: isCritical ? '#1C1111' : '#1A1508',
                    border: `1px solid ${isCritical ? '#3A1515' : '#3A2A10'}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Megaphone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: isCritical ? '#EF4444' : '#FB923C' }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: isCritical ? '#EF4444' : '#FB923C' }}>
                        {alert.title}
                      </p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: isCritical ? '#A06060' : '#8A6A30' }}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Student Card ── */}
        <Link href="/dashboard/student-profile" className="block active:scale-[0.98] transition-transform duration-150">
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--pms-card-alt)' }}
              >
                <GraduationCap className="w-5 h-5" style={{ color: 'var(--pms-text-sec)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--pms-text)' }}>
                  {student.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--pms-text-muted)' }}>
                  {student.registerNumber} &middot; {student.department.code} &middot; Year {student.year}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pms-text-muted)' }} />
            </div>
          </div>
        </Link>

        {/* ── Quick Stats Grid ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Attendance */}
          <Link href="/dashboard/attendance" className="active:scale-[0.97] transition-transform duration-150">
            <div className="rounded-2xl p-4 h-[140px] flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
              <AttendanceDonut percent={attendancePercent} />
              <p className="text-[11px] mt-2.5 font-medium" style={{ color: 'var(--pms-text-sec)' }}>Attendance</p>
              {isAttendanceLow && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" style={{ color: '#EF4444' }} />
                  <span className="text-[10px] font-semibold" style={{ color: '#EF4444' }}>Below 75%</span>
                </div>
              )}
            </div>
          </Link>

          {/* Avg Score */}
          <Link href="/dashboard/academics" className="active:scale-[0.97] transition-transform duration-150">
            <div className="rounded-2xl p-4 h-[140px] flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--pms-text-muted)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--pms-text)' }}>
                  {avgScore > 0 ? `${avgScore}%` : '--'}
                </span>
              </div>
              <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--pms-text-sec)' }}>Avg Score</p>
              <div className="mt-1.5">
                <ScoreSparkline data={sparklineData} />
              </div>
            </div>
          </Link>

          {/* Fees */}
          <Link href="/dashboard/fees" className="active:scale-[0.97] transition-transform duration-150">
            <div className="rounded-2xl p-4 h-[140px] flex flex-col justify-between" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" style={{ color: 'var(--pms-text-muted)' }} />
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Fees</span>
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: totalDue > 0 ? 'var(--pms-text)' : '#4ADE80' }}>
                  {totalDue > 0 ? `₹${totalDue.toLocaleString('en-IN')}` : 'Paid'}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
                  {totalDue > 0 ? 'due' : 'all clear'}
                </p>
              </div>
              <FeeMiniBar paid={totalPaid} total={totalFeeAmount} />
            </div>
          </Link>

          {/* Activity */}
          <Link href="/dashboard/notifications" className="active:scale-[0.97] transition-transform duration-150">
            <div className="rounded-2xl p-4 h-[140px] flex flex-col justify-between" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" style={{ color: 'var(--pms-text-muted)' }} />
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Activity</span>
              </div>
              <p className="text-3xl font-bold" style={{ color: 'var(--pms-text)' }}>
                {unreadNotifications}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>unread alerts</p>
            </div>
          </Link>
        </div>

        {/* ── Attendance Trend ── */}
        {attendanceTrendData.length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Attendance Trend</h2>
              <span className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>30 days</span>
            </div>
            <AttendanceTrendChart data={attendanceTrendData} />
          </div>
        )}

        {/* ── Subject Performance ── */}
        {subjectPerformanceData.length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Subjects</h2>
              <Link href="/dashboard/academics" className="text-[11px] font-medium flex items-center gap-0.5" style={{ color: 'var(--pms-text-muted)' }}>
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <SubjectPerformanceChart data={subjectPerformanceData} />
          </div>
        )}

        {/* ── Upcoming Events ── */}
        {upcomingEvents.length > 0 && (
          <Link href="/dashboard/calendar">
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--pms-text)' }}>
                  <Calendar className="w-4 h-4" style={{ color: 'var(--pms-text-muted)' }} />
                  Upcoming
                </h2>
                <span className="text-[11px] font-medium flex items-center gap-0.5" style={{ color: 'var(--pms-text-muted)' }}>
                  View all <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="space-y-0">
                {upcomingEvents.slice(0, 4).map((event, i) => {
                  const typeColor = event.type === 'EXAM' ? 'var(--pms-red)' : event.type === 'HOLIDAY' ? 'var(--pms-green)' : 'var(--pms-text-sec)'
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3.5 py-2.5"
                      style={{ borderBottom: i < Math.min(upcomingEvents.length, 4) - 1 ? '1px solid var(--pms-border)' : 'none' }}
                    >
                      <div className="text-center flex-shrink-0" style={{ minWidth: 36 }}>
                        <p className="text-base font-bold leading-none" style={{ color: typeColor }}>
                          {format(new Date(event.startDate), 'd')}
                        </p>
                        <p className="text-[8px] font-bold uppercase mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
                          {format(new Date(event.startDate), 'MMM')}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--pms-text)' }}>{event.title}</p>
                        <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{event.type}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Link>
        )}

        {/* ── Recent Activity ── */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Recent Activity</h2>
            <Link
              href="/dashboard/notifications"
              className="text-[11px] font-medium flex items-center gap-0.5"
              style={{ color: 'var(--pms-text-muted)' }}
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--pms-text-muted)' }}>No recent activity</p>
          ) : (
            <div>
              {notifications.slice(0, 4).map((n, i) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 py-3"
                  style={{
                    borderBottom: i < Math.min(notifications.length, 4) - 1 ? '1px solid var(--pms-border)' : 'none',
                  }}
                >
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--pms-text)' }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm leading-snug"
                      style={{
                        color: !n.isRead ? 'var(--pms-text)' : 'var(--pms-text-muted)',
                        fontWeight: !n.isRead ? 500 : 400,
                      }}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--pms-text-muted)' }}>
                      {n.message}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--pms-text-muted)' }}>
                      {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <div className="px-5 pt-6 pb-8 space-y-5" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Dashboard</h1>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: 'var(--pms-text-sec)' }}>Unable to load dashboard</p>
          </div>
        </div>
      </div>
    )
  }
}
