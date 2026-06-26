import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import { AttendanceStatus } from '@prisma/client'
import { format } from 'date-fns'
import AttendanceClient from './attendance-client'

export default async function AttendancePage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: true }
    })
    if (!parent || parent.students.length === 0) return <div className="p-8 text-center text-[var(--pms-text-muted)]">No student linked.</div>

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: { subject: true },
      orderBy: { date: 'desc' }
    })

    // Group by subject
    const bySubject: Record<string, { name: string; code: string; total: number; present: number; absent: number; od: number }> = {}
    for (const r of records) {
      if (!bySubject[r.subjectId]) {
        bySubject[r.subjectId] = { name: r.subject.name, code: r.subject.code, total: 0, present: 0, absent: 0, od: 0 }
      }
      bySubject[r.subjectId].total++
      if (r.status === AttendanceStatus.PRESENT) bySubject[r.subjectId].present++
      if (r.status === AttendanceStatus.ABSENT) bySubject[r.subjectId].absent++
      if (r.status === AttendanceStatus.OD) bySubject[r.subjectId].od++
    }

    const subjectStats = Object.entries(bySubject).map(([id, s]) => ({
      id,
      ...s,
      leave: s.total - s.present - s.absent - s.od,
      percentage: s.total > 0 ? Math.round(((s.present + s.od) / s.total) * 100) : 0
    }))

    const totalClasses = records.length
    const totalPresent = records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length
    const totalAbsent = records.filter(r => r.status === AttendanceStatus.ABSENT).length
    const totalOD = records.filter(r => r.status === AttendanceStatus.OD).length
    const totalLeave = totalClasses - totalPresent - totalAbsent + totalOD
    const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0

    // Daily attendance trend (group by date, last 30 unique dates)
    const byDate: Record<string, { total: number; present: number }> = {}
    for (const r of records) {
      const dateKey = format(new Date(r.date), 'yyyy-MM-dd')
      if (!byDate[dateKey]) byDate[dateKey] = { total: 0, present: 0 }
      byDate[dateKey].total++
      if (r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD) byDate[dateKey].present++
    }
    const trendData = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, d]) => ({
        date: format(new Date(date), 'MMM d'),
        pct: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0
      }))

    const recentRecords = records.slice(0, 20).map(r => ({
      id: r.id,
      subjectName: r.subject.name,
      date: format(new Date(r.date), 'EEE, MMM d'),
      status: r.status as string
    }))

    const classesNeeded = totalClasses > 0
      ? Math.ceil((0.75 * totalClasses - totalPresent) / 0.25)
      : 0

    return (
      <AttendanceClient
        studentName={student.name}
        registerNumber={student.registerNumber}
        overallPct={overallPct}
        totalClasses={totalClasses}
        totalPresent={totalPresent - totalOD}
        totalAbsent={totalAbsent}
        totalOD={totalOD}
        totalLeave={totalLeave}
        subjectStats={subjectStats}
        trendData={trendData}
        recentRecords={recentRecords}
        classesNeeded={classesNeeded}
      />
    )
  } catch (error) {
    return <div className="p-8 text-center text-[var(--pms-text-muted)]">Error loading attendance. Please check database connection.</div>
  }
}
