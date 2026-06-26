import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function StudentsAdminPage() {
  try {
    const students = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: {
        department: true,
        parent: { include: { user: true } },
        attendanceRecords: true,
        feeRecords: true,
      },
      orderBy: { registerNumber: 'asc' }
    })

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#09090B' }}>
        <div className="p-8 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>
              Students
            </h1>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
              >
                {students.length}
              </span>
              <Link
                href="/admin/students/new"
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-[0.98]"
                style={{ backgroundColor: '#FAFAFA', color: '#09090B' }}
              >
                <Plus size={16} />
                Add Student
              </Link>
            </div>
          </div>

          {/* Student Cards */}
          <div className="space-y-3">
            {students.map(s => {
              const total = s.attendanceRecords.length
              const present = s.attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'OD').length
              const attPct = total > 0 ? Math.round((present / total) * 100) : 0
              const hasOverdue = s.feeRecords.some(f => f.status === 'OVERDUE')
              const hasPending = s.feeRecords.some(f => f.status === 'PENDING' || f.status === 'PARTIAL')
              const attColor = attPct >= 75 ? '#4ADE80' : '#EF4444'
              const feeColor = hasOverdue ? '#EF4444' : hasPending ? '#FB923C' : '#4ADE80'
              const feeLabel = hasOverdue ? 'Overdue' : hasPending ? 'Pending' : 'Clear'

              return (
                <div
                  key={s.id}
                  className="rounded-2xl p-4 space-y-3"
                  style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
                >
                  {/* Top row: name + department badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#FAFAFA' }}>
                        {s.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                        {s.registerNumber}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
                    >
                      {s.department.code}
                    </span>
                  </div>

                  {/* Info row: Year/Sem + Parent */}
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: '#71717A' }}>
                      Year {Math.ceil(s.semester / 2)} &middot; Sem {s.semester} &middot; Sec {s.section}
                    </span>
                    {s.parent ? (
                      <span className="truncate ml-2" style={{ color: '#52525B' }}>
                        {s.parent.user.name}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#EF444418', color: '#EF4444' }}>
                        No parent
                      </span>
                    )}
                  </div>

                  {/* Bottom row: Attendance + Fee + Consent */}
                  <div className="flex items-center gap-3">
                    {/* Attendance */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-medium" style={{ color: '#52525B' }}>
                          Attendance
                        </span>
                        <span className="text-xs font-bold" style={{ color: attColor }}>
                          {attPct}%
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full" style={{ backgroundColor: '#27272A' }}>
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{ width: `${attPct}%`, backgroundColor: attColor }}
                        />
                      </div>
                    </div>

                    {/* Fee status */}
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: `${feeColor}18`, color: feeColor }}
                    >
                      {feeLabel}
                    </span>

                    {/* Consent dot */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: s.consentStatus === 'GIVEN' ? '#4ADE80' : '#EF4444'
                        }}
                      />
                      <span className="text-[10px]" style={{ color: '#52525B' }}>
                        {s.consentStatus === 'GIVEN' ? 'Consent' : 'No consent'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {students.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: '#52525B' }}>No active students found.</p>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090B' }}>
        <p className="text-sm" style={{ color: '#52525B' }}>Error loading students. Database connection required.</p>
      </div>
    )
  }
}
