import { getStudentSession } from '@/lib/student-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AttendanceStatus } from '@prisma/client'
import { CalendarCheck, AlertTriangle, BookOpen } from 'lucide-react'

export default async function AttendancePage() {
  const session = await getStudentSession()
  if (!session) redirect('/login')

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { studentId: session.studentId },
    include: { subject: true },
    orderBy: { date: 'desc' },
  })

  // Group by subject
  const subjectMap = new Map<string, {
    subjectName: string
    subjectCode: string
    total: number
    present: number
  }>()

  for (const record of attendanceRecords) {
    const existing = subjectMap.get(record.subjectId) || {
      subjectName: record.subject.name,
      subjectCode: record.subject.code,
      total: 0,
      present: 0,
    }
    existing.total++
    if (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.OD) {
      existing.present++
    }
    subjectMap.set(record.subjectId, existing)
  }

  const subjects = Array.from(subjectMap.values()).sort((a, b) => {
    const pctA = a.total > 0 ? (a.present / a.total) * 100 : 0
    const pctB = b.total > 0 ? (b.present / b.total) * 100 : 0
    return pctA - pctB // lowest first
  })

  // Overall stats
  const totalClasses = attendanceRecords.length
  const totalPresent = attendanceRecords.filter(
    r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD
  ).length
  const overallPercent = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0
  const isLow = overallPercent < 75

  return (
    <div className="px-5 pt-5 pb-28 space-y-4" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
          Attendance
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>
          Attendance Summary
        </h1>
      </div>

      {/* Overall Card */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: 'var(--pms-card)',
          border: '1px solid var(--pms-border)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--pms-glow)' }}
          >
            <span className="text-2xl font-bold" style={{ color: isLow ? '#EF4444' : '#22C55E' }}>
              {overallPercent}%
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Overall Attendance</p>
            <p className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>
              {totalPresent} present out of {totalClasses} classes
            </p>
            {isLow && (
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" style={{ color: '#EF4444' }} />
                <p className="text-[10px] font-bold" style={{ color: '#EF4444' }}>
                  Below 75% - Attendance shortage
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject-wise Cards */}
      {subjects.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <CalendarCheck className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--pms-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--pms-text-muted)' }}>No attendance records yet.</p>
        </div>
      ) : (
        subjects.map(({ subjectName, subjectCode, total, present }) => {
          const pct = total > 0 ? Math.round((present / total) * 100) : 0
          const subjectLow = pct < 75
          return (
            <div
              key={subjectCode}
              className="rounded-2xl p-4"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pms-text)' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--pms-text)' }}>{subjectName}</p>
                    <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{subjectCode}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold" style={{ color: subjectLow ? '#EF4444' : '#22C55E' }}>
                    {pct}%
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>
                    {present}/{total}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pms-border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: subjectLow ? '#EF4444' : '#22C55E',
                  }}
                />
              </div>

              {subjectLow && (
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle className="w-3 h-3" style={{ color: '#EF4444' }} />
                  <p className="text-[10px] font-semibold" style={{ color: '#EF4444' }}>
                    Below 75% threshold
                  </p>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
