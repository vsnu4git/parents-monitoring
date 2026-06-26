import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import { AttendanceStatus } from '@prisma/client'
import { ReportClient } from './report-client'

export default async function ReportPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: { include: { department: true } } },
    })
    if (!parent || parent.students.length === 0) return <div className="p-8 text-[var(--pms-text-muted)]" style={{ backgroundColor: 'var(--pms-bg)' }}>No student linked.</div>

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0,0,0,0)

    const [attendance, marks, fees, food, txns, checkIns, odTrips] = await Promise.all([
      prisma.attendanceRecord.findMany({ where: { studentId: student.id, date: { gte: weekStart } }, include: { subject: true } }),
      prisma.markRecord.findMany({ where: { studentId: student.id, publishedAt: { gte: weekStart } }, include: { subject: true } }),
      prisma.feeRecord.findMany({ where: { studentId: student.id } }),
      prisma.foodLog.findMany({ where: { studentId: student.id, loggedAt: { gte: weekStart } } }),
      prisma.campusOneAccount.findUnique({ where: { studentId: student.id }, include: { transactions: { where: { transactionAt: { gte: weekStart } } } } }),
      prisma.studentCheckIn.findMany({ where: { studentId: student.id, createdAt: { gte: weekStart } } }),
      prisma.oDTrip.findMany({ where: { studentId: student.id, createdAt: { gte: weekStart } } }),
    ])

    const total = attendance.length
    const present = attendance.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length
    const attPct = total > 0 ? Math.round((present / total) * 100) : 0
    const totalSpent = txns?.transactions?.reduce((s, t) => s + t.amount, 0) || 0
    const totalFoodSpent = food.reduce((s, f) => s + f.amount, 0)
    const mealsLogged = food.length
    const avgMealsPerDay = mealsLogged > 0 ? (mealsLogged / 7).toFixed(1) : '0'
    const pendingFees = fees.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE' || f.status === 'PARTIAL')
    const totalDue = pendingFees.reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0)

    const dailyAtt: { day: string; present: number; absent: number }[] = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const dayRecords = attendance.filter(r => new Date(r.date).toDateString() === d.toDateString())
      const p = dayRecords.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length
      dailyAtt.push({ day: dayNames[d.getDay()], present: p, absent: dayRecords.length - p })
    }

    const data = JSON.parse(JSON.stringify({
      student, attPct, total, present, totalSpent, totalFoodSpent,
      mealsLogged, avgMealsPerDay, totalDue, pendingFees: pendingFees.length,
      checkIns: checkIns.length, odTrips: odTrips.length,
      marks: marks.map(m => ({ subject: m.subject.name, score: m.score, maxScore: m.maxScore, type: m.assessmentType })),
      dailyAtt,
    }))
    return <ReportClient data={data} />
  } catch {
    return <div className="p-8 text-[var(--pms-text-muted)]" style={{ backgroundColor: 'var(--pms-bg)' }}>Error loading report.</div>
  }
}
