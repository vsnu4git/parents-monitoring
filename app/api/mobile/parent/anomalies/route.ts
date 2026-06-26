import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { AttendanceStatus } from '@prisma/client'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: auth.userId },
      include: { students: { where: { status: 'ACTIVE' } } },
    })
    if (!parent || parent.students.length === 0) {
      return Response.json({ anomalies: [], summary: { critical: 0, high: 0, medium: 0, low: 0 } })
    }

    const anomalies: { type: string; severity: string; title: string; description: string; detectedAt: string; studentName: string }[] = []
    const now = new Date()

    for (const student of parent.students) {
      const fourteenDaysAgo = new Date(now)
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Attendance check
      const records = await prisma.attendanceRecord.findMany({
        where: { studentId: student.id, date: { gte: fourteenDaysAgo } },
      })
      const week1 = records.filter(r => new Date(r.date) < sevenDaysAgo)
      const week2 = records.filter(r => new Date(r.date) >= sevenDaysAgo)
      if (week1.length > 0 && week2.length > 0) {
        const w1pct = (week1.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length / week1.length) * 100
        const w2pct = (week2.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length / week2.length) * 100
        const drop = w1pct - w2pct
        if (drop > 5) {
          anomalies.push({
            type: 'ATTENDANCE_DROP', severity: drop > 10 ? 'CRITICAL' : 'HIGH',
            title: `${student.name}: Attendance Dropping`,
            description: `Attendance went from ${Math.round(w1pct)}% to ${Math.round(w2pct)}% (${Math.round(drop)} point drop)`,
            detectedAt: now.toISOString(), studentName: student.name,
          })
        }
      }

      // Overall low attendance
      const allAtt = await prisma.attendanceRecord.findMany({ where: { studentId: student.id } })
      if (allAtt.length > 0) {
        const overallPct = (allAtt.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length / allAtt.length) * 100
        if (overallPct < 75) {
          anomalies.push({
            type: 'LOW_ATTENDANCE', severity: overallPct < 65 ? 'CRITICAL' : 'HIGH',
            title: `${student.name}: Low Attendance`,
            description: `Overall attendance is ${Math.round(overallPct)}%, below the 75% threshold`,
            detectedAt: now.toISOString(), studentName: student.name,
          })
        }
      }

      // Spending spike
      const account = await prisma.campusOneAccount.findUnique({
        where: { studentId: student.id },
        include: { transactions: { where: { transactionAt: { gte: fourteenDaysAgo } } } },
      })
      if (account && account.transactions.length > 0) {
        const thisWeek = account.transactions.filter(t => new Date(t.transactionAt) >= sevenDaysAgo).reduce((s, t) => s + t.amount, 0)
        const lastWeek = account.transactions.filter(t => new Date(t.transactionAt) < sevenDaysAgo).reduce((s, t) => s + t.amount, 0)
        if (lastWeek > 0 && thisWeek > lastWeek * 1.5) {
          anomalies.push({
            type: 'SPENDING_SPIKE', severity: thisWeek > lastWeek * 2 ? 'CRITICAL' : 'HIGH',
            title: `${student.name}: Spending Spike`,
            description: `This week's spending (₹${thisWeek}) is ${Math.round((thisWeek / lastWeek) * 100)}% of last week (₹${lastWeek})`,
            detectedAt: now.toISOString(), studentName: student.name,
          })
        }
      }

      // Missed meals
      const threeDaysAgo = new Date(now)
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const foodLogs = await prisma.foodLog.findMany({
        where: { studentId: student.id, loggedAt: { gte: threeDaysAgo } },
      })
      const mealsByDay: Record<string, number> = {}
      foodLogs.forEach(f => {
        const key = new Date(f.loggedAt).toISOString().split('T')[0]
        mealsByDay[key] = (mealsByDay[key] || 0) + 1
      })
      const lowMealDays = Object.values(mealsByDay).filter(c => c < 2).length
      if (lowMealDays > 0) {
        anomalies.push({
          type: 'MISSED_MEALS', severity: lowMealDays >= 2 ? 'HIGH' : 'MEDIUM',
          title: `${student.name}: Missed Meals`,
          description: `${lowMealDays} day(s) with fewer than 2 meals in the last 3 days`,
          detectedAt: now.toISOString(), studentName: student.name,
        })
      }

      // Location alerts
      const locationAlerts = await prisma.locationAlert.count({
        where: { studentId: student.id, createdAt: { gte: sevenDaysAgo } },
      })
      if (locationAlerts > 3) {
        anomalies.push({
          type: 'UNUSUAL_LOCATION', severity: locationAlerts > 5 ? 'HIGH' : 'MEDIUM',
          title: `${student.name}: Location Alerts`,
          description: `${locationAlerts} location alerts in the past 7 days`,
          detectedAt: now.toISOString(), studentName: student.name,
        })
      }
    }

    const summary = {
      critical: anomalies.filter(a => a.severity === 'CRITICAL').length,
      high: anomalies.filter(a => a.severity === 'HIGH').length,
      medium: anomalies.filter(a => a.severity === 'MEDIUM').length,
      low: anomalies.filter(a => a.severity === 'LOW').length,
    }

    // Sort: CRITICAL first
    const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    anomalies.sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4))

    return Response.json({ anomalies, summary })
  } catch (e) {
    console.error('Anomalies error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
