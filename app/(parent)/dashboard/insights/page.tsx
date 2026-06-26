import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AttendanceStatus } from '@prisma/client'
import { InsightsClient } from './insights-client'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'

export default async function InsightsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: { include: { department: true } } },
    })
    if (!parent || parent.students.length === 0) {
      return <div className="p-8 min-h-screen text-[var(--pms-text-muted)]" style={{ backgroundColor: 'var(--pms-bg)' }}>No student linked.</div>
    }

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)
    const now = new Date()
    const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7); thisWeekStart.setHours(0, 0, 0, 0)
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30)

    const [
      allAttendance, thisWeekAttendance, lastWeekAttendance,
      allMarks, allFees,
      thisWeekFood, lastWeekFood,
      thisWeekTxns, lastWeekTxns,
      checkIns, odTrips, alerts,
    ] = await Promise.all([
      prisma.attendanceRecord.findMany({ where: { studentId: student.id }, include: { subject: true }, orderBy: { date: 'desc' } }),
      prisma.attendanceRecord.findMany({ where: { studentId: student.id, date: { gte: thisWeekStart } }, include: { subject: true } }),
      prisma.attendanceRecord.findMany({ where: { studentId: student.id, date: { gte: lastWeekStart, lt: thisWeekStart } }, include: { subject: true } }),
      prisma.markRecord.findMany({ where: { studentId: student.id }, include: { subject: true }, orderBy: { publishedAt: 'desc' } }),
      prisma.feeRecord.findMany({ where: { studentId: student.id } }),
      prisma.foodLog.findMany({ where: { studentId: student.id, loggedAt: { gte: thisWeekStart } } }),
      prisma.foodLog.findMany({ where: { studentId: student.id, loggedAt: { gte: lastWeekStart, lt: thisWeekStart } } }),
      prisma.campusOneAccount.findUnique({ where: { studentId: student.id }, include: { transactions: { where: { transactionAt: { gte: thisWeekStart } } } } }),
      prisma.campusOneAccount.findUnique({ where: { studentId: student.id }, include: { transactions: { where: { transactionAt: { gte: lastWeekStart, lt: thisWeekStart } } } } }),
      prisma.studentCheckIn.findMany({ where: { studentId: student.id, createdAt: { gte: monthAgo } }, orderBy: { createdAt: 'desc' } }),
      prisma.oDTrip.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.locationAlert.findMany({ where: { studentId: student.id, createdAt: { gte: monthAgo } } }),
    ])

    const insights: { type: 'warning' | 'danger' | 'positive' | 'info'; icon: string; title: string; detail: string }[] = []

    const calcPct = (records: typeof thisWeekAttendance) => {
      const t = records.length; const p = records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length
      return t > 0 ? Math.round((p / t) * 100) : -1
    }
    const thisWeekPct = calcPct(thisWeekAttendance)
    const lastWeekPct = calcPct(lastWeekAttendance)
    if (thisWeekPct >= 0 && lastWeekPct >= 0) {
      const diff = thisWeekPct - lastWeekPct
      if (diff <= -10) insights.push({ type: 'danger', icon: '📉', title: `Attendance dropped ${Math.abs(diff)}%`, detail: `From ${lastWeekPct}% last week to ${thisWeekPct}% this week. Significant decline.` })
      else if (diff <= -5) insights.push({ type: 'warning', icon: '⚠️', title: `Attendance down ${Math.abs(diff)}%`, detail: `${thisWeekPct}% this week vs ${lastWeekPct}% last week.` })
      else if (diff >= 5) insights.push({ type: 'positive', icon: '📈', title: `Attendance improved +${diff}%`, detail: `Up from ${lastWeekPct}% to ${thisWeekPct}%. Great progress!` })
    }
    if (thisWeekPct >= 0 && thisWeekPct < 75) {
      insights.push({ type: 'danger', icon: '🚨', title: 'Below minimum attendance', detail: `Currently at ${thisWeekPct}%. Below the 75% threshold — risk of exam debarment.` })
    }

    const subjectMap = new Map<string, { name: string; recent: number[]; older: number[] }>()
    for (const m of allMarks) {
      const entry = subjectMap.get(m.subjectId) || { name: m.subject.name, recent: [], older: [] }
      const pct = Math.round((m.score / m.maxScore) * 100)
      const isRecent = m.publishedAt && new Date(m.publishedAt) >= monthAgo
      if (isRecent) entry.recent.push(pct); else entry.older.push(pct)
      subjectMap.set(m.subjectId, entry)
    }
    for (const [, s] of subjectMap) {
      if (s.recent.length > 0 && s.older.length > 0) {
        const recentAvg = Math.round(s.recent.reduce((a, b) => a + b, 0) / s.recent.length)
        const olderAvg = Math.round(s.older.reduce((a, b) => a + b, 0) / s.older.length)
        if (recentAvg < olderAvg - 15) insights.push({ type: 'danger', icon: '📚', title: `${s.name} declining`, detail: `Average dropped from ${olderAvg}% to ${recentAvg}%. Needs attention.` })
        else if (recentAvg > olderAvg + 10) insights.push({ type: 'positive', icon: '⭐', title: `${s.name} improving`, detail: `Average rose from ${olderAvg}% to ${recentAvg}%. Keep it up!` })
      }
    }

    const thisWeekMealsPerDay = thisWeekFood.length > 0 ? (thisWeekFood.length / 7) : 0
    const lastWeekMealsPerDay = lastWeekFood.length > 0 ? (lastWeekFood.length / 7) : 0
    const breakfastCount = thisWeekFood.filter(f => f.mealType === 'BREAKFAST').length
    if (breakfastCount <= 2) insights.push({ type: 'warning', icon: '🍳', title: `Skipping breakfast`, detail: `Only ${breakfastCount} breakfasts logged in 7 days. Breakfast is important for focus.` })
    if (thisWeekMealsPerDay < 2 && thisWeekFood.length > 0) insights.push({ type: 'danger', icon: '🍽️', title: 'Low meal intake', detail: `Averaging ${thisWeekMealsPerDay.toFixed(1)} meals/day this week. Should be at least 3.` })
    if (thisWeekMealsPerDay >= 3 && lastWeekMealsPerDay < 3) insights.push({ type: 'positive', icon: '✅', title: 'Meal habits improved', detail: `${thisWeekMealsPerDay.toFixed(1)} meals/day this week, up from ${lastWeekMealsPerDay.toFixed(1)} last week.` })

    const thisWeekSpend = thisWeekTxns?.transactions?.reduce((s, t) => s + t.amount, 0) || 0
    const lastWeekSpend = lastWeekTxns?.transactions?.reduce((s, t) => s + t.amount, 0) || 0
    if (lastWeekSpend > 0 && thisWeekSpend > lastWeekSpend * 1.4) {
      insights.push({ type: 'warning', icon: '💰', title: 'Spending up ' + Math.round(((thisWeekSpend - lastWeekSpend) / lastWeekSpend) * 100) + '%', detail: `₹${thisWeekSpend} this week vs ₹${lastWeekSpend} last week.` })
    }
    if (lastWeekSpend > 0 && thisWeekSpend < lastWeekSpend * 0.7) {
      insights.push({ type: 'info', icon: '💵', title: 'Spending decreased', detail: `₹${thisWeekSpend} this week vs ₹${lastWeekSpend} last week. Good control.` })
    }

    const overdueFees = allFees.filter(f => f.status === 'OVERDUE')
    if (overdueFees.length > 0) {
      const total = overdueFees.reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0)
      insights.push({ type: 'danger', icon: '🏦', title: `${overdueFees.length} fee${overdueFees.length > 1 ? 's' : ''} overdue`, detail: `Total due: ₹${total.toLocaleString('en-IN')}. Please clear to avoid penalties.` })
    }

    const missedTrips = odTrips.filter(t => t.status === 'MISSED')
    if (missedTrips.length > 0) {
      insights.push({ type: 'danger', icon: '📍', title: `${missedTrips.length} OD destination missed`, detail: `Student didn't reach the registered destination. Verify with faculty.` })
    }
    const completedTrips = odTrips.filter(t => t.status === 'ARRIVED' || t.status === 'RETURNED')
    if (completedTrips.length > 0 && missedTrips.length === 0) {
      insights.push({ type: 'positive', icon: '✅', title: 'All OD trips verified', detail: `${completedTrips.length} trip${completedTrips.length > 1 ? 's' : ''} completed successfully.` })
    }

    const missedCheckins = alerts.filter(a => a.type === 'MISSED_CHECKIN')
    if (missedCheckins.length >= 3) {
      insights.push({ type: 'warning', icon: '🔔', title: `${missedCheckins.length} missed check-ins this month`, detail: 'Student frequently misses morning check-in. May indicate late arrivals.' })
    }

    if (insights.length === 0) {
      insights.push({ type: 'positive', icon: '🌟', title: 'Everything looks great!', detail: 'No concerns detected. Your child is on track.' })
    }

    const overallAtt = calcPct(allAttendance)
    let trustScore = 50
    if (overallAtt >= 85) trustScore += 15; else if (overallAtt >= 75) trustScore += 8; else trustScore -= 10
    if (breakfastCount >= 5) trustScore += 5; else if (breakfastCount <= 2) trustScore -= 5
    if (missedTrips.length === 0) trustScore += 10; else trustScore -= 15
    if (missedCheckins.length === 0) trustScore += 10; else if (missedCheckins.length >= 3) trustScore -= 10
    if (overdueFees.length === 0) trustScore += 5; else trustScore -= 5
    if (thisWeekPct >= 80) trustScore += 5
    trustScore = Math.max(0, Math.min(100, trustScore))

    const trustLevel = trustScore >= 80 ? 'Excellent' : trustScore >= 60 ? 'Good' : trustScore >= 40 ? 'Moderate' : 'Needs Attention'

    const weekComparison = {
      attendance: { thisWeek: thisWeekPct, lastWeek: lastWeekPct },
      meals: { thisWeek: thisWeekFood.length, lastWeek: lastWeekFood.length },
      spending: { thisWeek: thisWeekSpend, lastWeek: lastWeekSpend },
      checkIns: { thisWeek: checkIns.filter(c => new Date(c.createdAt) >= thisWeekStart).length, lastWeek: checkIns.filter(c => new Date(c.createdAt) >= lastWeekStart && new Date(c.createdAt) < thisWeekStart).length },
    }

    const data = JSON.parse(JSON.stringify({
      student,
      insights,
      trustScore,
      trustLevel,
      weekComparison,
      dangerCount: insights.filter(i => i.type === 'danger').length,
      warningCount: insights.filter(i => i.type === 'warning').length,
      positiveCount: insights.filter(i => i.type === 'positive').length,
    }))

    return <InsightsClient data={data} />
  } catch (error) {
    console.error('Insights error:', error)
    return <div className="p-8 min-h-screen text-[var(--pms-text-muted)]" style={{ backgroundColor: 'var(--pms-bg)' }}>Error loading insights.</div>
  }
}
