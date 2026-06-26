import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { MonitorClient } from './monitor-client'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'

export default async function MonitorPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: { include: { department: true } } }
    })
    if (!parent || parent.students.length === 0) {
      return <div className="px-5 pt-5 text-[var(--pms-text-muted)]">No student linked.</div>
    }

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)

    const [lastCheckIn, todayCheckIns, activeODTrips, recentAlerts, campusAccount, todayFood, zones] = await Promise.all([
      prisma.studentCheckIn.findFirst({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.studentCheckIn.findMany({
        where: { studentId: student.id, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.oDTrip.findMany({
        where: { studentId: student.id, status: { in: ['PENDING', 'IN_TRANSIT'] } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.locationAlert.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.campusOneAccount.findUnique({
        where: { studentId: student.id },
        include: { transactions: { orderBy: { transactionAt: 'desc' }, take: 20 } },
      }),
      prisma.foodLog.findMany({
        where: { studentId: student.id, loggedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.geofenceZone.findMany({ where: { isActive: true } }),
    ])

    const isOnCampus = lastCheckIn?.type === 'CAMPUS_ENTRY' || lastCheckIn?.type === 'AUTO'

    // Serialize dates for client component
    const data = JSON.parse(JSON.stringify({
      student,
      isOnCampus,
      lastCheckIn,
      todayCheckIns,
      activeODTrips,
      recentAlerts,
      campusAccount,
      todayFood,
      zones,
    }))

    return <MonitorClient data={data} />
  } catch (error) {
    console.error('Monitor error:', error)
    return <div className="px-5 pt-5 text-[var(--pms-text-muted)]">Error loading monitoring data.</div>
  }
}
