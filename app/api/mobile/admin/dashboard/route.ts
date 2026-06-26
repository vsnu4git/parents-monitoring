import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      totalStudents,
      totalFaculty,
      totalParents,
      pendingFeesAgg,
      pendingLeavesCount,
      openTicketsCount,
      todayAttendance,
      feesCollectedAgg,
      feesTotalAgg,
      recentEmergencyAlerts,
    ] = await Promise.all([
      // Total active students
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      // Total faculty
      prisma.faculty.count(),
      // Total parents
      prisma.parent.count(),
      // Pending fees total
      prisma.feeRecord.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      }),
      // Pending leaves
      prisma.leaveRecord.count({ where: { status: 'PENDING' } }),
      // Open tickets
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      // Today's attendance
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { date: { gte: today, lt: tomorrow } },
        _count: { id: true },
      }),
      // Total fees collected (paid amount across all)
      prisma.feeRecord.aggregate({ _sum: { paidAmount: true } }),
      // Total fees due (total amount across all)
      prisma.feeRecord.aggregate({ _sum: { totalAmount: true } }),
      // Recent emergency alerts (last 7 days)
      prisma.emergencyAlert.count({
        where: {
          isActive: true,
          publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    // Parse attendance summary
    const attendanceSummary = {
      present: 0,
      absent: 0,
      total: 0,
    }
    for (const group of todayAttendance) {
      const count = group._count.id
      attendanceSummary.total += count
      if (group.status === 'PRESENT') attendanceSummary.present += count
      if (group.status === 'ABSENT') attendanceSummary.absent += count
    }

    const pendingFeesTotal =
      (pendingFeesAgg._sum.totalAmount || 0) - (pendingFeesAgg._sum.paidAmount || 0)

    return Response.json({
      totalStudents,
      totalFaculty,
      totalParents,
      pendingFeesTotal,
      pendingLeavesCount,
      openTicketsCount,
      attendanceSummary,
      revenue: {
        collected: feesCollectedAgg._sum.paidAmount || 0,
        totalDue: feesTotalAgg._sum.totalAmount || 0,
      },
      recentEmergencyAlerts,
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
