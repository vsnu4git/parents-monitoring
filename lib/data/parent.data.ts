import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { AttendanceStatus } from '@prisma/client'

export async function getParentWithStudents() {
  const session = await auth()
  if (!session?.user?.id) return null

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      students: {
        include: { department: true }
      }
    }
  })
  return parent
}

export async function getStudentAttendanceSummary(studentId: string) {
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId },
    include: { subject: true },
    orderBy: { date: 'desc' }
  })

  // Group by subject
  const bySubject = records.reduce((acc, r) => {
    const key = r.subject.id
    if (!acc[key]) acc[key] = { subject: r.subject, total: 0, present: 0, absent: 0, od: 0, leave: 0 }
    acc[key].total++
    if (r.status === AttendanceStatus.PRESENT) acc[key].present++
    if (r.status === AttendanceStatus.ABSENT) acc[key].absent++
    if (r.status === AttendanceStatus.OD) acc[key].od++
    if (r.status === AttendanceStatus.LEAVE) acc[key].leave++
    return acc
  }, {} as Record<string, any>)

  const subjectStats = Object.values(bySubject).map((s: any) => ({
    ...s,
    percentage: s.total > 0 ? Math.round(((s.present + s.od) / s.total) * 100) : 0
  }))

  const totalRecords = records.length
  const totalPresent = records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length
  const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0

  return { subjectStats, overallPercentage, totalRecords, totalPresent }
}

export async function getStudentMarksSummary(studentId: string) {
  const marks = await prisma.markRecord.findMany({
    where: { studentId },
    include: { subject: true },
    orderBy: { publishedAt: 'desc' }
  })
  return marks
}

export async function getStudentFees(studentId: string) {
  const fees = await prisma.feeRecord.findMany({
    where: { studentId },
    orderBy: { dueDate: 'desc' }
  })
  return fees
}

export async function getStudentLeaves(studentId: string) {
  return prisma.leaveRecord.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getParentNotifications(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: { students: true }
  })
  if (!parent) return []

  const studentIds = parent.students.map(s => s.id)

  return prisma.notification.findMany({
    where: {
      OR: [
        { targetRole: 'PARENT', studentId: { in: studentIds } },
        { targetRole: 'PARENT', studentId: null },
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
}

export async function getActiveEmergencyAlerts() {
  return prisma.emergencyAlert.findMany({
    where: { isActive: true },
    orderBy: { publishedAt: 'desc' }
  })
}

export async function getActiveNotices() {
  return prisma.notice.findMany({
    where: { isActive: true },
    orderBy: { publishedAt: 'desc' }
  })
}

export async function getCalendarEvents() {
  const now = new Date()
  return prisma.calendarEvent.findMany({
    where: { startDate: { gte: now } },
    orderBy: { startDate: 'asc' },
    take: 10
  })
}

export async function getParentTickets(parentId: string) {
  return prisma.ticket.findMany({
    where: { parentId },
    include: {
      student: true,
      replies: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { updatedAt: 'desc' }
  })
}
