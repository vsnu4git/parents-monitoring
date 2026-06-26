import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { AttendanceStatus, FeeStatus } from '@prisma/client'
import {
  User, Hash, Building2, CalendarDays,
  BookOpen, Users, ChevronLeft, Activity, CreditCard, ClipboardList,
} from 'lucide-react'
import Link from 'next/link'

export default async function StudentProfilePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: { include: { department: true } } }
  })

  if (!parent || parent.students.length === 0) {
    return (
      <div className="px-5 pt-5" style={{ color: 'var(--pms-text-muted)' }}>
        No student linked.
      </div>
    )
  }

  const selectedId = await getSelectedStudentId()
  const student = resolveSelectedStudent(parent.students, selectedId)

  const [attendanceRecords, feeRecords, markRecords] = await Promise.all([
    prisma.attendanceRecord.findMany({ where: { studentId: student.id } }),
    prisma.feeRecord.findMany({ where: { studentId: student.id } }),
    prisma.markRecord.findMany({ where: { studentId: student.id }, include: { subject: true } }),
  ])

  const totalClasses = attendanceRecords.length
  const presentClasses = attendanceRecords.filter(
    r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD
  ).length
  const attendancePercent = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

  const totalFees = feeRecords.reduce((s, f) => s + f.totalAmount, 0)
  const paidFees = feeRecords.reduce((s, f) => s + f.paidAmount, 0)
  const pendingFees = feeRecords.filter(f => f.status !== FeeStatus.PAID && f.status !== FeeStatus.WAIVED).length

  const avgScore = markRecords.length > 0
    ? Math.round(markRecords.reduce((s, m) => s + (m.score / m.maxScore) * 100, 0) / markRecords.length)
    : 0

  const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const infoItems = [
    { icon: User, label: 'Full Name', value: student.name },
    { icon: Hash, label: 'Register Number', value: student.registerNumber },
    { icon: Building2, label: 'Department', value: student.department.name },
    { icon: CalendarDays, label: 'Year', value: `Year ${student.year}` },
    { icon: BookOpen, label: 'Semester', value: `Semester ${student.semester}` },
    { icon: Users, label: 'Section', value: `Section ${student.section}` },
  ]

  return (
    <div className="px-5 pt-5 pb-28 space-y-4 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm active:scale-[0.98] transition-all duration-150"
        style={{ color: 'var(--pms-brown)' }}
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Profile Card */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--pms-brown)' }}>
            <span className="text-2xl font-bold" style={{ color: 'var(--pms-bg)' }}>{initials}</span>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--pms-text)' }}>{student.name}</p>
          <p className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>{student.registerNumber}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
            {student.department.name}
          </p>
          <div
            className="mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase"
            style={{
              backgroundColor: student.status === 'ACTIVE' ? '#22C55E1A' : '#EF44441A',
              color: student.status === 'ACTIVE' ? '#22C55E' : '#EF4444',
            }}
          >
            {student.status}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <ClipboardList className="w-4 h-4 mx-auto mb-1" style={{ color: attendancePercent < 75 ? '#EF4444' : '#22C55E' }} />
          <p className="text-lg font-bold" style={{ color: attendancePercent < 75 ? '#EF4444' : '#22C55E' }}>
            {attendancePercent}%
          </p>
          <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Attendance</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <Activity className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--pms-brown)' }} />
          <p className="text-lg font-bold" style={{ color: 'var(--pms-brown)' }}>
            {avgScore > 0 ? `${avgScore}%` : 'N/A'}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Avg Score</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <CreditCard className="w-4 h-4 mx-auto mb-1" style={{ color: pendingFees > 0 ? '#F59E0B' : '#22C55E' }} />
          <p className="text-lg font-bold" style={{ color: pendingFees > 0 ? '#F59E0B' : '#22C55E' }}>
            {pendingFees > 0 ? pendingFees : 'Clear'}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Pending Fees</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pms-border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--pms-text)' }}>Student Information</p>
        </div>
        <div>
          {infoItems.map(({ icon: Icon, label, value }, i) => (
            <div key={label} className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: i < infoItems.length - 1 ? '1px solid var(--pms-border)' : 'none' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--pms-bg)' }}>
                <Icon className="w-4 h-4" style={{ color: 'var(--pms-brown)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pms-border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--pms-text)' }}>Quick Actions</p>
        </div>
        {[
          { href: '/dashboard/attendance', icon: ClipboardList, label: 'View Attendance' },
          { href: '/dashboard/academics', icon: BookOpen, label: 'View Academics' },
          { href: '/dashboard/fees', icon: CreditCard, label: 'View Fees' },
          { href: '/dashboard/monitor', icon: Activity, label: 'Monitor Location' },
        ].map(({ href, icon: Icon, label }, i) => (
          <Link key={href} href={href}>
            <div
              className="px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-all duration-150"
              style={{ borderBottom: i < 3 ? '1px solid var(--pms-border)' : 'none' }}
            >
              <Icon className="w-4 h-4" style={{ color: 'var(--pms-brown)' }} />
              <span className="text-sm flex-1" style={{ color: 'var(--pms-text)' }}>{label}</span>
              <ChevronLeft className="w-4 h-4 rotate-180" style={{ color: 'var(--pms-text-muted)' }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
