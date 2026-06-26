import { getStudentSession } from '@/lib/student-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import {
  GraduationCap, User, Hash, Building2, CalendarDays,
  BookOpen, Users, CreditCard, FileText, LogOut, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { SignOutButton } from './sign-out-button'

export default async function ProfilePage() {
  const session = await getStudentSession()
  if (!session) redirect('/login')

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    include: { department: true },
  })

  if (!student) redirect('/login')

  const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const infoItems = [
    { icon: User, label: 'Full Name', value: student.name },
    { icon: Hash, label: 'Register Number', value: student.registerNumber },
    { icon: Building2, label: 'Department', value: student.department.name },
    { icon: CalendarDays, label: 'Year', value: `Year ${student.year}` },
    { icon: BookOpen, label: 'Semester', value: `Semester ${student.semester}` },
    { icon: Users, label: 'Section', value: `Section ${student.section}` },
  ]

  const quickLinks = [
    { href: '/student/notices', icon: FileText, label: 'Notices', description: 'View announcements' },
    { href: '/student/fees', icon: CreditCard, label: 'Fee Records', description: 'Check payment status' },
  ]

  return (
    <div className="px-5 pt-5 pb-28 space-y-4" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
          Account
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>
          Profile
        </h1>
      </div>

      {/* Profile Card */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--pms-card)',
          border: '1px solid var(--pms-border)',
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: 'var(--pms-text)' }}
          >
            <span className="text-2xl font-bold" style={{ color: 'var(--pms-bg)' }}>{initials}</span>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--pms-text)' }}>{student.name}</p>
          <p className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>
            {student.registerNumber}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
            {student.department.name} · Year {student.year} · Sem {student.semester}
          </p>
          <div
            className="mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase"
            style={{
              backgroundColor: student.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: student.status === 'ACTIVE' ? '#22C55E' : '#EF4444',
            }}
          >
            {student.status}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pms-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Student Information</p>
        </div>
        <div>
          {infoItems.map(({ icon: Icon, label, value }, idx) => (
            <div
              key={label}
              className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: idx < infoItems.length - 1 ? '1px solid var(--pms-border)' : 'none' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--pms-glow)' }}
              >
                <Icon className="w-4 h-4" style={{ color: 'var(--pms-text)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{value}</p>
              </div>
            </div>
          ))}
          {student.dateOfBirth && (
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--pms-border)' }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--pms-glow)' }}
              >
                <CalendarDays className="w-4 h-4" style={{ color: 'var(--pms-text)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Date of Birth</p>
                <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>
                  {format(new Date(student.dateOfBirth), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pms-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Quick Links</p>
        </div>
        <div>
          {quickLinks.map(({ href, icon: Icon, label, description }, idx) => (
            <Link key={href} href={href}>
              <div
                className="px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-all duration-150"
                style={{ borderBottom: idx < quickLinks.length - 1 ? '1px solid var(--pms-border)' : 'none' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--pms-glow)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'var(--pms-text)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{description}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pms-text-muted)' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <SignOutButton />
    </div>
  )
}
