import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'
import FoodClient from './food-client'

export default async function FoodPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: true },
    })
    if (!parent || parent.students.length === 0) {
      return <div className="p-8 text-center text-[var(--pms-text-muted)]">No student linked.</div>
    }

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfDay(subDays(now, 6))

    // Today's food logs
    const todayLogs = await prisma.foodLog.findMany({
      where: {
        studentId: student.id,
        loggedAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { loggedAt: 'asc' },
    })

    // Week's food logs
    const weekLogs = await prisma.foodLog.findMany({
      where: {
        studentId: student.id,
        loggedAt: { gte: weekStart, lte: todayEnd },
      },
      orderBy: { loggedAt: 'asc' },
    })

    // Serialize today's meals
    const todayMeals = todayLogs.map((log) => ({
      id: log.id,
      mealType: log.mealType,
      items: log.items,
      vendor: log.vendor,
      amount: log.amount,
      time: format(new Date(log.loggedAt), 'h:mm a'),
    }))

    // Weekly daily spend breakdown (7 days)
    const dailySpend: { day: string; amount: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i)
      const dayStart = startOfDay(d)
      const dayEnd = endOfDay(d)
      const dayAmount = weekLogs
        .filter((l) => {
          const la = new Date(l.loggedAt)
          return la >= dayStart && la <= dayEnd
        })
        .reduce((sum, l) => sum + l.amount, 0)
      dailySpend.push({ day: format(d, 'EEE'), amount: dayAmount })
    }

    // Meal frequency per day (last 7 days)
    const mealFrequency: { day: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i)
      const dayStart = startOfDay(d)
      const dayEnd = endOfDay(d)
      const dayCount = weekLogs.filter((l) => {
        const la = new Date(l.loggedAt)
        return la >= dayStart && la <= dayEnd
      }).length
      mealFrequency.push({ day: format(d, 'EEE'), count: dayCount })
    }

    // Current hour to determine which meals should have been taken
    const currentHour = now.getHours()

    // Determine missed meals for today
    const loggedMealTypes = new Set(todayLogs.map((l) => l.mealType))
    const mealWindows = [
      { type: 'BREAKFAST', startHour: 7, endHour: 10 },
      { type: 'LUNCH', startHour: 12, endHour: 14 },
      { type: 'SNACKS', startHour: 15, endHour: 17 },
      { type: 'DINNER', startHour: 19, endHour: 21 },
    ]

    const missedMeals = mealWindows
      .filter(
        (m) => currentHour >= m.endHour && !loggedMealTypes.has(m.type as 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER')
      )
      .map((m) => m.type)

    const todayTotalSpend = todayLogs.reduce((sum, l) => sum + l.amount, 0)
    const todayMealCount = todayLogs.length

    return (
      <FoodClient
        studentName={student.name}
        todayMeals={todayMeals}
        missedMeals={missedMeals}
        dailySpend={dailySpend}
        mealFrequency={mealFrequency}
        todayTotalSpend={todayTotalSpend}
        todayMealCount={todayMealCount}
        currentHour={currentHour}
      />
    )
  } catch {
    return <div className="p-8 text-center text-[var(--pms-text-muted)]">Error loading food data. Please check database connection.</div>
  }
}
