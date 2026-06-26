import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import { startOfDay, startOfWeek, endOfDay, format, subDays } from 'date-fns'
import ExpensesClient from './expenses-client'

export default async function ExpensesPage() {
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

    const account = await prisma.campusOneAccount.findUnique({
      where: { studentId: student.id },
    })

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })

    // All transactions for this week
    const weekTransactions = account
      ? await prisma.campusTransaction.findMany({
          where: {
            accountId: account.id,
            transactionAt: { gte: weekStart, lte: todayEnd },
          },
          orderBy: { transactionAt: 'desc' },
        })
      : []

    // Today's spending
    const todayTransactions = weekTransactions.filter(
      (t) => new Date(t.transactionAt) >= todayStart
    )
    const todaySpend = todayTransactions.reduce((sum, t) => sum + t.amount, 0)

    // Weekly daily breakdown (7 days)
    const dailySpend: { day: string; amount: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i)
      const dayStart = startOfDay(d)
      const dayEnd = endOfDay(d)
      const dayAmount = weekTransactions
        .filter((t) => {
          const ta = new Date(t.transactionAt)
          return ta >= dayStart && ta <= dayEnd
        })
        .reduce((sum, t) => sum + t.amount, 0)
      dailySpend.push({ day: format(d, 'EEE'), amount: dayAmount })
    }

    // Category breakdown
    const categoryTotals: Record<string, number> = {}
    for (const t of weekTransactions) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    }
    const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
    }))

    // Recent transactions (last 50)
    const recentTransactions = account
      ? await prisma.campusTransaction.findMany({
          where: { accountId: account.id },
          orderBy: { transactionAt: 'desc' },
          take: 50,
        })
      : []

    const serializedTransactions = recentTransactions.map((t) => ({
      id: t.id,
      category: t.category,
      vendor: t.vendor,
      description: t.description,
      amount: t.amount,
      transactionAt: format(new Date(t.transactionAt), 'MMM d, h:mm a'),
    }))

    const weekTotal = weekTransactions.reduce((sum, t) => sum + t.amount, 0)

    return (
      <ExpensesClient
        studentName={student.name}
        balance={account?.balance ?? 0}
        isConnected={account?.isConnected ?? false}
        todaySpend={todaySpend}
        weekTotal={weekTotal}
        dailySpend={dailySpend}
        categoryData={categoryData}
        transactions={serializedTransactions}
      />
    )
  } catch {
    return <div className="p-8 text-center text-[var(--pms-text-muted)]">Error loading expenses. Please check database connection.</div>
  }
}
