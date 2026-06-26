import { getStudentSession } from '@/lib/student-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AttendanceStatus, FeeStatus } from '@prisma/client'
import {
  GraduationCap, BookOpen, BarChart3, CreditCard, Calendar,
  FileText, Bell, ChevronRight, TrendingUp, Award,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  AttendanceDonut,
  ScoreSparkline,
  AttendanceTrendChart,
  SubjectPerformanceChart,
} from '@/components/dashboard-charts'

export default async function StudentDashboardPage() {
  const session = await getStudentSession()
  if (!session) redirect('/login')

  try {
    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      include: { department: true },
    })
    if (!student) redirect('/login')

    const [
      attendanceRecords,
      markRecords,
      feeRecords,
      notices,
      upcomingEvents,
      leaveRecords,
    ] = await Promise.all([
      prisma.attendanceRecord.findMany({ where: { studentId: student.id }, include: { subject: true } }),
      prisma.markRecord.findMany({ where: { studentId: student.id }, include: { subject: true }, orderBy: { publishedAt: 'desc' }, take: 20 }),
      prisma.feeRecord.findMany({ where: { studentId: student.id }, orderBy: { dueDate: 'desc' } }),
      prisma.notice.findMany({ where: { isActive: true }, orderBy: { publishedAt: 'desc' }, take: 5 }),
      prisma.calendarEvent.findMany({ where: { isPublic: true, startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, take: 5 }),
      prisma.leaveRecord.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ])

    const totalClasses = attendanceRecords.length
    const presentClasses = attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length
    const attendancePercent = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
    const isAttendanceLow = attendancePercent < 75

    const pendingFees = feeRecords.filter(f => f.status === FeeStatus.PENDING || f.status === FeeStatus.PARTIAL || f.status === FeeStatus.OVERDUE)
    const totalDue = pendingFees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0)

    const recentMarks = markRecords.slice(0, 10)
    const avgScore = recentMarks.length > 0
      ? Math.round(recentMarks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / recentMarks.length)
      : 0

    const sparklineData = [...recentMarks].reverse().map(m => ({
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
      if (r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD) entry.present++
      dateMap.set(key, entry)
    }
    const attendanceTrendData = Array.from(dateMap.entries()).map(([date, { total, present }]) => ({
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

    const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
      <div className="px-5 pt-5 pb-28 space-y-4" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>

        {/* Greeting Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
              Student Portal
            </p>
            <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>
              Hi, {student.name.split(' ')[0]}
            </h1>
          </div>
          <Link href="/student/profile">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--pms-text)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--pms-bg)' }}>{initials}</span>
            </div>
          </Link>
        </div>

        {/* Student Info Card */}
        <div
          className="rounded-2xl p-4"
          style={{
            backgroundColor: 'var(--pms-card)',
            border: '1px solid var(--pms-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--pms-glow)' }}
            >
              <GraduationCap className="w-5 h-5" style={{ color: 'var(--pms-text)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--pms-text)' }}>{student.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--pms-text-sec)' }}>
                {student.registerNumber} · {student.department.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
                Year {student.year} · Semester {student.semester} · Section {student.section}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid - 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/student/attendance">
            <div
              className="rounded-2xl p-4 text-center active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <AttendanceDonut percent={attendancePercent} />
              <p className="text-[10px] font-medium mt-1" style={{ color: 'var(--pms-text-sec)' }}>Attendance</p>
              {isAttendanceLow && (
                <p className="text-[9px] font-bold" style={{ color: '#EF4444' }}>Below 75%</p>
              )}
            </div>
          </Link>

          <Link href="/student/academics">
            <div
              className="rounded-2xl p-4 text-center active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="w-4 h-4" style={{ color: 'var(--pms-text)' }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--pms-text)' }}>
                {avgScore > 0 ? `${avgScore}%` : 'N/A'}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--pms-text-sec)' }}>Avg Score</p>
            </div>
          </Link>

          <Link href="/student/fees">
            <div
              className="rounded-2xl p-4 text-center active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <CreditCard className="w-4 h-4 mx-auto mb-1" style={{ color: totalDue > 0 ? '#F59E0B' : '#22C55E' }} />
              <p className="text-lg font-bold" style={{ color: totalDue > 0 ? '#F59E0B' : '#22C55E' }}>
                {totalDue > 0 ? `₹${(totalDue / 1000).toFixed(0)}k` : 'Paid'}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--pms-text-sec)' }}>Fees Due</p>
            </div>
          </Link>
        </div>

        {/* Score Sparkline */}
        {sparklineData.length > 0 && (
          <Link href="/student/academics">
            <div
              className="rounded-2xl p-4 active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--pms-text)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Recent Scores</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--pms-text-muted)' }} />
              </div>
              <ScoreSparkline data={sparklineData} />
            </div>
          </Link>
        )}

        {/* Attendance Trend */}
        {attendanceTrendData.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Attendance Trend</h2>
              <span className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Last 30 days</span>
            </div>
            <AttendanceTrendChart data={attendanceTrendData} />
          </div>
        )}

        {/* Subject Performance */}
        {subjectPerformanceData.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Subject Performance</h2>
              <span className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Avg %</span>
            </div>
            <SubjectPerformanceChart data={subjectPerformanceData} />
          </div>
        )}

        {/* Upcoming Events (max 3) */}
        {upcomingEvents.length > 0 && (
          <Link href="/student/calendar">
            <div
              className="rounded-2xl p-4 active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: 'var(--pms-text)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Upcoming</h2>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--pms-text-muted)' }} />
              </div>
              {upcomingEvents.slice(0, 3).map((event, i) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: i < Math.min(upcomingEvents.length, 3) - 1 ? '1px solid var(--pms-border)' : 'none' }}
                >
                  <div className="text-center flex-shrink-0" style={{ minWidth: 36 }}>
                    <p className="text-sm font-bold" style={{ color: 'var(--pms-text)' }}>
                      {format(new Date(event.startDate), 'd')}
                    </p>
                    <p className="text-[8px] font-bold uppercase" style={{ color: 'var(--pms-text-muted)' }}>
                      {format(new Date(event.startDate), 'MMM')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--pms-text)' }}>{event.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{event.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </Link>
        )}

        {/* Latest Notices (max 3) */}
        {notices.length > 0 && (
          <Link href="/student/notices">
            <div
              className="rounded-2xl p-4 active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: 'var(--pms-text)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Notices</h2>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--pms-text-muted)' }} />
              </div>
              {notices.slice(0, 3).map((notice, i) => (
                <div
                  key={notice.id}
                  className="py-2"
                  style={{ borderBottom: i < Math.min(notices.length, 3) - 1 ? '1px solid var(--pms-border)' : 'none' }}
                >
                  <p className="text-xs font-semibold" style={{ color: 'var(--pms-text)' }}>{notice.title}</p>
                  <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'var(--pms-text-muted)' }}>{notice.content}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
                    {format(new Date(notice.publishedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </Link>
        )}
      </div>
    )
  } catch (error) {
    console.error('Student dashboard error:', error)
    return (
      <div className="px-5 pt-6" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
        <p style={{ color: 'var(--pms-text-sec)' }}>Unable to load dashboard.</p>
      </div>
    )
  }
}
