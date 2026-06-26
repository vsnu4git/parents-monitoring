import { prisma } from '@/lib/prisma'
import { AttendanceStatus, Role, SOSStatus, AnomalySeverity, AnomalyType } from '@prisma/client'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-dev-secret'

export async function getParentWithStudentsByUserId(userId: string) {
  return prisma.parent.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, role: true } },
      students: {
        include: { department: true },
        where: { status: 'ACTIVE' },
      },
    },
  })
}

export async function getParentDashboard(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: { students: { where: { status: 'ACTIVE' }, include: { department: true } } },
  })
  if (!parent) return null

  const studentIds = parent.students.map((s) => s.id)

  const [alerts, notices, recentMarks, fees, notifications, tickets] = await Promise.all([
    prisma.emergencyAlert.findMany({ where: { isActive: true }, orderBy: { publishedAt: 'desc' } }),
    prisma.notice.findMany({ where: { isActive: true }, orderBy: { publishedAt: 'desc' }, take: 5 }),
    prisma.markRecord.findMany({
      where: { studentId: { in: studentIds } },
      include: { subject: true, student: true },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    }),
    prisma.feeRecord.findMany({
      where: { studentId: { in: studentIds }, status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] } },
      include: { student: true },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: 'PARENT', studentId: { in: studentIds } },
          { targetRole: 'PARENT', studentId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.ticket.findMany({
      where: { parentId: parent.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ])

  // Attendance warnings per student
  const attendanceWarnings = await Promise.all(
    parent.students.map(async (student) => {
      const records = await prisma.attendanceRecord.findMany({ where: { studentId: student.id } })
      const total = records.length
      const present = records.filter(
        (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD
      ).length
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100
      return { student, percentage, isLow: percentage < 75 }
    })
  )

  return {
    parent,
    students: parent.students,
    alerts,
    notices,
    recentMarks,
    pendingFees: fees,
    notifications,
    recentTickets: tickets,
    attendanceWarnings,
  }
}

export async function getStudentAttendanceSummary(studentId: string) {
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId },
    include: { subject: true },
    orderBy: { date: 'desc' },
  })

  const bySubject = records.reduce(
    (acc, r) => {
      const key = r.subject.id
      if (!acc[key])
        acc[key] = { subject: r.subject, total: 0, present: 0, absent: 0, od: 0, leave: 0 }
      acc[key].total++
      if (r.status === AttendanceStatus.PRESENT) acc[key].present++
      if (r.status === AttendanceStatus.ABSENT) acc[key].absent++
      if (r.status === AttendanceStatus.OD) acc[key].od++
      if (r.status === AttendanceStatus.LEAVE) acc[key].leave++
      return acc
    },
    {} as Record<string, { subject: any; total: number; present: number; absent: number; od: number; leave: number }>
  )

  const subjectStats = Object.values(bySubject).map((s) => ({
    ...s,
    percentage: s.total > 0 ? Math.round(((s.present + s.od) / s.total) * 100) : 0,
  }))

  const totalRecords = records.length
  const totalPresent = records.filter(
    (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD
  ).length
  const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0

  return { subjectStats, overallPercentage, totalRecords, totalPresent }
}

export async function getStudentMarks(studentId: string) {
  return prisma.markRecord.findMany({
    where: { studentId },
    include: { subject: true },
    orderBy: { publishedAt: 'desc' },
  })
}

export async function getStudentFees(studentId: string) {
  return prisma.feeRecord.findMany({
    where: { studentId },
    include: { acknowledgements: true },
    orderBy: { dueDate: 'desc' },
  })
}

export async function getStudentLeaves(studentId: string) {
  return prisma.leaveRecord.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getParentNotifications(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: { students: true },
  })
  if (!parent) return []

  const studentIds = parent.students.map((s) => s.id)

  return prisma.notification.findMany({
    where: {
      OR: [
        { targetRole: 'PARENT', studentId: { in: studentIds } },
        { targetRole: 'PARENT', studentId: null },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function getActiveNoticesWithAck(userId: string) {
  const parent = await prisma.parent.findUnique({ where: { userId } })

  const notices = await prisma.notice.findMany({
    where: { isActive: true },
    include: {
      acknowledgements: parent ? { where: { parentId: parent.id } } : false,
    },
    orderBy: { publishedAt: 'desc' },
  })

  return notices.map((n) => ({
    ...n,
    acknowledged: Array.isArray(n.acknowledgements) && n.acknowledgements.length > 0,
    acknowledgements: undefined,
  }))
}

export async function getActiveAlertsWithAck(userId: string) {
  const parent = await prisma.parent.findUnique({ where: { userId } })

  const alerts = await prisma.emergencyAlert.findMany({
    where: { isActive: true },
    include: {
      acknowledgements: parent ? { where: { parentId: parent.id } } : false,
    },
    orderBy: { publishedAt: 'desc' },
  })

  return alerts.map((a) => ({
    ...a,
    acknowledged: Array.isArray(a.acknowledgements) && a.acknowledgements.length > 0,
    acknowledgements: undefined,
  }))
}

export async function getCalendarEvents() {
  return prisma.calendarEvent.findMany({
    where: { startDate: { gte: new Date() } },
    orderBy: { startDate: 'asc' },
    take: 20,
  })
}

export async function getParentTickets(userId: string) {
  const parent = await prisma.parent.findUnique({ where: { userId } })
  if (!parent) return []

  return prisma.ticket.findMany({
    where: { parentId: parent.id },
    include: {
      student: true,
      replies: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getTicketById(ticketId: string, userId: string) {
  const parent = await prisma.parent.findUnique({ where: { userId } })
  if (!parent) return null

  return prisma.ticket.findFirst({
    where: { id: ticketId, parentId: parent.id },
    include: {
      student: true,
      replies: {
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function verifyStudentBelongsToParent(studentId: string, userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: { students: { where: { id: studentId } } },
  })
  return parent && parent.students.length > 0 ? parent : null
}

export async function getStudentCampusStatus(studentId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const checkIns = await prisma.studentCheckIn.findMany({
    where: { studentId, createdAt: { gte: today } },
    orderBy: { createdAt: 'desc' },
  })

  const lastCheckIn = checkIns[0] || null
  const isOnCampus = lastCheckIn
    ? lastCheckIn.type === 'CAMPUS_ENTRY' || lastCheckIn.type === 'AUTO'
    : false

  return { isOnCampus, lastCheckIn, todayCheckIns: checkIns }
}

export async function getStudentODTrips(studentId: string) {
  return prisma.oDTrip.findMany({
    where: { studentId },
    include: { leaveRecord: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

export async function getStudentExpenses(studentId: string) {
  const account = await prisma.campusOneAccount.findUnique({
    where: { studentId },
    include: {
      transactions: {
        orderBy: { transactionAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!account) return { balance: 0, transactions: [] }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const todaySpent = account.transactions
    .filter((t) => new Date(t.transactionAt) >= today)
    .reduce((sum, t) => sum + t.amount, 0)

  const weekSpent = account.transactions
    .filter((t) => new Date(t.transactionAt) >= weekStart)
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    balance: account.balance,
    todaySpent,
    weekSpent,
    transactions: account.transactions,
  }
}

export async function getStudentFoodLog(studentId: string) {
  return prisma.foodLog.findMany({
    where: { studentId },
    orderBy: { loggedAt: 'desc' },
    take: 50,
  })
}

export async function getStudentLocation(studentId: string) {
  const lastCheckIn = await prisma.studentCheckIn.findFirst({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  })

  const alerts = await prisma.locationAlert.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const zones = await prisma.geofenceZone.findMany({
    where: { isActive: true },
  })

  return { lastCheckIn, alerts, zones }
}

export async function getSOSAlerts(parentId: string) {
  return prisma.sOSAlert.findMany({
    where: { parentId },
    include: { student: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

export async function triggerSOS(parentId: string, data: { studentId: string; message?: string; latitude?: number; longitude?: number }) {
  return prisma.sOSAlert.create({
    data: {
      parentId,
      studentId: data.studentId,
      message: data.message || 'SOS triggered by parent',
      latitude: data.latitude,
      longitude: data.longitude,
      status: 'ACTIVE',
    },
    include: { student: true },
  })
}

export async function updateSOSAlertStatus(parentId: string, alertId: string, status: string) {
  const alert = await prisma.sOSAlert.findFirst({
    where: { id: alertId, parentId },
  })
  if (!alert) throw new Error('Alert not found')

  return prisma.sOSAlert.update({
    where: { id: alertId },
    data: {
      status: status as SOSStatus,
      ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
    },
    include: { student: true },
  })
}

export async function getParentControls(parentId: string) {
  return prisma.parentControl.findUnique({
    where: { parentId },
  })
}

export async function updateParentControls(
  parentId: string,
  data: {
    studentId: string
    spendingLimitDaily?: number | null
    spendingLimitWeekly?: number | null
    attendanceTarget?: number | null
    curfewTime?: string | null
    geofenceAlerts?: boolean
    mealAlerts?: boolean
    spendingAlerts?: boolean
  }
) {
  return prisma.parentControl.upsert({
    where: { parentId },
    create: { parentId, ...data },
    update: data,
  })
}

export async function getParentInsights(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: { students: { where: { status: 'ACTIVE' } } },
  })
  if (!parent || parent.students.length === 0) return null

  const studentId = parent.students[0].id
  const now = new Date()
  const thisWeekStart = new Date(now)
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
  thisWeekStart.setHours(0, 0, 0, 0)
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const [attendance, checkIns, foodLogs, account, locationAlerts] = await Promise.all([
    prisma.attendanceRecord.findMany({ where: { studentId } }),
    prisma.studentCheckIn.findMany({
      where: { studentId, createdAt: { gte: lastWeekStart } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.foodLog.findMany({
      where: { studentId, loggedAt: { gte: lastWeekStart } },
    }),
    prisma.campusOneAccount.findUnique({
      where: { studentId },
      include: { transactions: { where: { transactionAt: { gte: lastWeekStart } } } },
    }),
    prisma.locationAlert.findMany({
      where: { studentId, createdAt: { gte: lastWeekStart } },
    }),
  ])

  // Compute attendance percentage
  const totalAtt = attendance.length
  const presentAtt = attendance.filter(
    (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD
  ).length
  const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100

  // Week comparison
  const thisWeekCheckIns = checkIns.filter((c) => new Date(c.createdAt) >= thisWeekStart).length
  const lastWeekCheckIns = checkIns.filter((c) => new Date(c.createdAt) < thisWeekStart).length
  const thisWeekMeals = foodLogs.filter((f) => new Date(f.loggedAt) >= thisWeekStart).length
  const lastWeekMeals = foodLogs.filter((f) => new Date(f.loggedAt) < thisWeekStart).length
  const thisWeekSpending = (account?.transactions || [])
    .filter((t) => new Date(t.transactionAt) >= thisWeekStart)
    .reduce((s, t) => s + t.amount, 0)
  const lastWeekSpending = (account?.transactions || [])
    .filter((t) => new Date(t.transactionAt) < thisWeekStart)
    .reduce((s, t) => s + t.amount, 0)

  // Trust score (0-100)
  const factors: { label: string; score: number; weight: number }[] = []
  factors.push({ label: 'Attendance', score: Math.min(attendancePct, 100), weight: 0.3 })
  factors.push({ label: 'Check-ins', score: thisWeekCheckIns >= 5 ? 100 : (thisWeekCheckIns / 5) * 100, weight: 0.2 })
  factors.push({ label: 'Meals', score: thisWeekMeals >= 14 ? 100 : (thisWeekMeals / 14) * 100, weight: 0.2 })
  const alertPenalty = Math.max(0, 100 - locationAlerts.length * 20)
  factors.push({ label: 'Location', score: alertPenalty, weight: 0.3 })

  const trustScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  )

  // Generate insights
  const insights: { type: string; severity: string; title: string; description: string }[] = []

  if (attendancePct < 75) {
    insights.push({ type: 'attendance', severity: 'critical', title: 'Low Attendance', description: `Attendance is at ${attendancePct}%, below 75% threshold.` })
  } else if (attendancePct < 85) {
    insights.push({ type: 'attendance', severity: 'warning', title: 'Attendance Needs Attention', description: `Attendance is at ${attendancePct}%.` })
  } else {
    insights.push({ type: 'attendance', severity: 'positive', title: 'Good Attendance', description: `Attendance is at ${attendancePct}%.` })
  }

  if (thisWeekSpending > lastWeekSpending * 1.5 && lastWeekSpending > 0) {
    insights.push({ type: 'spending', severity: 'warning', title: 'Spending Increase', description: `This week's spending is 50%+ higher than last week.` })
  }

  if (thisWeekMeals < 7) {
    insights.push({ type: 'meals', severity: 'warning', title: 'Low Meal Count', description: `Only ${thisWeekMeals} meals logged this week.` })
  } else {
    insights.push({ type: 'meals', severity: 'positive', title: 'Regular Meals', description: `${thisWeekMeals} meals logged this week.` })
  }

  if (locationAlerts.length > 3) {
    insights.push({ type: 'location', severity: 'critical', title: 'Frequent Location Alerts', description: `${locationAlerts.length} location alerts this week.` })
  }

  return {
    insights,
    trustScore: { score: trustScore, factors },
    weekComparison: {
      attendance: { thisWeek: attendancePct, lastWeek: attendancePct },
      meals: { thisWeek: thisWeekMeals, lastWeek: lastWeekMeals },
      spending: { thisWeek: thisWeekSpending, lastWeek: lastWeekSpending },
      checkIns: { thisWeek: thisWeekCheckIns, lastWeek: lastWeekCheckIns },
    },
  }
}

export async function getWeeklyReport(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: { students: { where: { status: 'ACTIVE' } } },
  })
  if (!parent || parent.students.length === 0) return null

  const studentId = parent.students[0].id
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const [attendance, marks, fees, foodLogs, account, checkIns, odTrips] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { studentId, date: { gte: weekStart } },
      include: { subject: true },
      orderBy: { date: 'desc' },
    }),
    prisma.markRecord.findMany({
      where: { studentId, publishedAt: { gte: weekStart } },
      include: { subject: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.feeRecord.findMany({
      where: { studentId, status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.foodLog.findMany({
      where: { studentId, loggedAt: { gte: weekStart } },
      orderBy: { loggedAt: 'desc' },
    }),
    prisma.campusOneAccount.findUnique({
      where: { studentId },
      include: { transactions: { where: { transactionAt: { gte: weekStart } }, orderBy: { transactionAt: 'desc' } } },
    }),
    prisma.studentCheckIn.findMany({
      where: { studentId, createdAt: { gte: weekStart } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.oDTrip.findMany({
      where: { studentId, createdAt: { gte: weekStart } },
      include: { leaveRecord: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const totalAtt = attendance.length
  const presentAtt = attendance.filter(
    (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD
  ).length
  const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100

  const totalSpending = (account?.transactions || []).reduce((s, t) => s + t.amount, 0)
  const totalMealSpend = foodLogs.reduce((s, f) => s + f.amount, 0)
  const pendingFeesTotal = fees.reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0)

  // Daily breakdown for chart
  const dailyBreakdown: { date: string; present: boolean; meals: number; spending: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now)
    day.setDate(day.getDate() - i)
    day.setHours(0, 0, 0, 0)
    const nextDay = new Date(day)
    nextDay.setDate(nextDay.getDate() + 1)

    const dayAttendance = attendance.filter((a) => {
      const d = new Date(a.date)
      return d >= day && d < nextDay
    })
    const dayPresent = dayAttendance.some(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.OD
    )
    const dayMeals = foodLogs.filter((f) => {
      const d = new Date(f.loggedAt)
      return d >= day && d < nextDay
    }).length
    const daySpending = (account?.transactions || [])
      .filter((t) => {
        const d = new Date(t.transactionAt)
        return d >= day && d < nextDay
      })
      .reduce((s, t) => s + t.amount, 0)

    dailyBreakdown.push({
      date: day.toISOString().split('T')[0],
      present: dayPresent,
      meals: dayMeals,
      spending: daySpending,
    })
  }

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: now.toISOString(),
    attendance: { percentage: attendancePct, total: totalAtt, present: presentAtt },
    marks,
    fees: { pending: fees.length, totalDue: pendingFeesTotal },
    meals: { count: foodLogs.length, totalSpend: totalMealSpend },
    spending: { total: totalSpending, transactions: account?.transactions || [] },
    checkIns: { count: checkIns.length },
    odTrips: { count: odTrips.length, trips: odTrips },
    dailyBreakdown,
  }
}

// ── Parent-Faculty Chat ──

export async function getParentConversations(userId: string) {
  const parent = await prisma.parent.findUnique({ where: { userId } })
  if (!parent) return []

  const conversations = await prisma.conversation.findMany({
    where: { parentId: parent.id },
    include: {
      faculty: { include: { user: { select: { name: true } } } },
      student: { select: { name: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return Promise.all(
    conversations.map(async (c) => {
      const unreadCount = await prisma.chatMessage.count({
        where: { conversationId: c.id, isRead: false, senderRole: { not: 'PARENT' as any } },
      })
      return {
        id: c.id,
        facultyName: c.faculty.user.name,
        facultyDepartment: c.faculty.department,
        studentName: c.student.name,
        lastMessage: c.messages[0]?.content ?? null,
        lastMessageAt: c.lastMessageAt,
        unreadCount,
      }
    })
  )
}

export async function getConversationMessages(conversationId: string, parentId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, parentId },
  })
  if (!conversation) return null

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Mark unread messages from other party as read
  await prisma.chatMessage.updateMany({
    where: { conversationId, isRead: false, senderRole: { not: 'PARENT' as any } },
    data: { isRead: true },
  })

  return messages
}

export async function sendChatMessage(
  conversationId: string,
  senderId: string,
  senderRole: string,
  content: string
) {
  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId,
      senderRole: senderRole as Role,
      content,
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  })

  return message
}

export async function startConversation(parentId: string, facultyId: string, studentId: string) {
  return prisma.conversation.upsert({
    where: {
      parentId_facultyId_studentId: { parentId, facultyId, studentId },
    },
    create: { parentId, facultyId, studentId },
    update: {},
    include: {
      faculty: { include: { user: { select: { name: true } } } },
      student: { select: { name: true } },
    },
  })
}

export async function getStudentFacultyList(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { departmentId: true, semester: true },
  })
  if (!student) return []

  const facultySubjects = await prisma.facultySubject.findMany({
    where: {
      subject: { departmentId: student.departmentId, semester: student.semester },
    },
    include: {
      faculty: { include: { user: { select: { name: true } } } },
      subject: { select: { name: true, code: true } },
    },
  })

  // Group by faculty
  const facultyMap = new Map<
    string,
    { id: string; userId: string; name: string; department: string; designation: string | null; subjects: { name: string; code: string }[] }
  >()

  for (const fs of facultySubjects) {
    const existing = facultyMap.get(fs.facultyId)
    const subj = { name: fs.subject.name, code: fs.subject.code }
    if (existing) {
      existing.subjects.push(subj)
    } else {
      facultyMap.set(fs.facultyId, {
        id: fs.facultyId,
        userId: fs.faculty.userId,
        name: fs.faculty.user.name,
        department: fs.faculty.department,
        designation: fs.faculty.designation,
        subjects: [subj],
      })
    }
  }

  return Array.from(facultyMap.values())
}

// ── Digital ID Card & QR Check-in ──

export async function getStudentIDCardData(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      department: { select: { code: true, name: true } },
    },
  })
  if (!student) return null

  return {
    name: student.name,
    registerNumber: student.registerNumber,
    department: student.department,
    year: student.year,
    semester: student.semester,
    section: student.section,
    photo: student.photo,
    dateOfBirth: student.dateOfBirth,
  }
}

export function generateStudentQRToken(studentId: string) {
  const now = Math.floor(Date.now() / 1000)
  const token = jwt.sign(
    { studentId, purpose: 'qr-checkin', iat: now },
    JWT_SECRET,
    { expiresIn: 30 }
  )
  const expiresAt = new Date((now + 30) * 1000).toISOString()
  return { token, expiresAt }
}

export async function verifyStudentQRToken(token: string): Promise<
  | { valid: true; student: { id: string; name: string; registerNumber: string; department: { code: string; name: string } } }
  | { valid: false; error: string }
> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      studentId: string
      purpose: string
    }

    if (payload.purpose !== 'qr-checkin') {
      return { valid: false, error: 'Invalid token purpose' }
    }

    const student = await prisma.student.findUnique({
      where: { id: payload.studentId },
      include: { department: { select: { code: true, name: true } } },
    })

    if (!student) {
      return { valid: false, error: 'Student not found' }
    }

    if (student.status !== 'ACTIVE') {
      return { valid: false, error: 'Student is not active' }
    }

    return {
      valid: true,
      student: {
        id: student.id,
        name: student.name,
        registerNumber: student.registerNumber,
        department: student.department,
      },
    }
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return { valid: false, error: 'QR token has expired' }
    }
    return { valid: false, error: 'Invalid QR token' }
  }
}

// ── Linear Regression Helper ──

function linearRegression(points: number[]): { slope: number; intercept: number } {
  const n = points.length
  if (n === 0) return { slope: 0, intercept: 0 }
  const xMean = (n - 1) / 2
  const yMean = points.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (points[i] - yMean)
    den += (i - xMean) ** 2
  }
  const slope = den !== 0 ? num / den : 0
  return { slope, intercept: yMean - slope * xMean }
}

// ── AI Anomaly Detection Engine ──

export async function detectAndGetAnomalies(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: { students: { where: { status: 'ACTIVE' } } },
  })
  if (!parent || parent.students.length === 0) return null

  const studentIds = parent.students.map((s) => s.id)
  const now = new Date()

  for (const studentId of studentIds) {
    const detected: { type: AnomalyType; severity: AnomalySeverity; title: string; description: string; metadata?: Record<string, unknown> }[] = []

    // a) ATTENDANCE_DROP — compare week1 vs week2 over last 14 days
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentAttendance = await prisma.attendanceRecord.findMany({
      where: { studentId, date: { gte: fourteenDaysAgo } },
    })

    const week1 = recentAttendance.filter((r) => new Date(r.date) < sevenDaysAgo)
    const week2 = recentAttendance.filter((r) => new Date(r.date) >= sevenDaysAgo)

    if (week1.length > 0 && week2.length > 0) {
      const week1Present = week1.filter((r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length
      const week2Present = week2.filter((r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.OD).length
      const week1Pct = (week1Present / week1.length) * 100
      const week2Pct = (week2Present / week2.length) * 100
      const drop = week1Pct - week2Pct

      if (drop > 10) {
        detected.push({
          type: 'ATTENDANCE_DROP',
          severity: 'CRITICAL',
          title: 'Significant Attendance Drop',
          description: `Attendance dropped from ${Math.round(week1Pct)}% to ${Math.round(week2Pct)}% (${Math.round(drop)} point decline).`,
          metadata: { week1Pct: Math.round(week1Pct), week2Pct: Math.round(week2Pct), drop: Math.round(drop) },
        })
      } else if (drop > 5) {
        detected.push({
          type: 'ATTENDANCE_DROP',
          severity: 'HIGH',
          title: 'Attendance Declining',
          description: `Attendance dropped from ${Math.round(week1Pct)}% to ${Math.round(week2Pct)}% (${Math.round(drop)} point decline).`,
          metadata: { week1Pct: Math.round(week1Pct), week2Pct: Math.round(week2Pct), drop: Math.round(drop) },
        })
      }
    }

    // b) SPENDING_SPIKE — this week vs 4-week average
    const account = await prisma.campusOneAccount.findUnique({ where: { studentId } })
    if (account) {
      const fourWeeksAgo = new Date(now)
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
      const thisWeekStart = new Date(now)
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
      thisWeekStart.setHours(0, 0, 0, 0)

      const transactions = await prisma.campusTransaction.findMany({
        where: { accountId: account.id, transactionAt: { gte: fourWeeksAgo } },
      })

      const thisWeekSpend = transactions
        .filter((t) => new Date(t.transactionAt) >= thisWeekStart)
        .reduce((s, t) => s + t.amount, 0)
      const olderTransactions = transactions.filter((t) => new Date(t.transactionAt) < thisWeekStart)
      const olderWeeks = Math.max(1, Math.ceil((thisWeekStart.getTime() - fourWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      const weeklyAvg = olderTransactions.reduce((s, t) => s + t.amount, 0) / olderWeeks

      if (weeklyAvg > 0) {
        const ratio = thisWeekSpend / weeklyAvg
        if (ratio > 2) {
          detected.push({
            type: 'SPENDING_SPIKE',
            severity: 'CRITICAL',
            title: 'Extreme Spending Spike',
            description: `This week's spending (${thisWeekSpend.toFixed(0)}) is ${ratio.toFixed(1)}x the 4-week average (${weeklyAvg.toFixed(0)}).`,
            metadata: { thisWeekSpend, weeklyAvg, ratio },
          })
        } else if (ratio > 1.5) {
          detected.push({
            type: 'SPENDING_SPIKE',
            severity: 'HIGH',
            title: 'Spending Above Average',
            description: `This week's spending (${thisWeekSpend.toFixed(0)}) is ${ratio.toFixed(1)}x the 4-week average (${weeklyAvg.toFixed(0)}).`,
            metadata: { thisWeekSpend, weeklyAvg, ratio },
          })
        }
      }
    }

    // c) MISSED_MEALS — last 3 days
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    threeDaysAgo.setHours(0, 0, 0, 0)

    const recentMeals = await prisma.foodLog.findMany({
      where: { studentId, loggedAt: { gte: threeDaysAgo } },
    })

    let lowMealDays = 0
    for (let i = 0; i < 3; i++) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayMeals = recentMeals.filter((m) => {
        const d = new Date(m.loggedAt)
        return d >= dayStart && d < dayEnd
      }).length

      if (dayMeals < 2) lowMealDays++
    }

    if (lowMealDays >= 2) {
      detected.push({
        type: 'MISSED_MEALS',
        severity: 'HIGH',
        title: 'Multiple Days With Missed Meals',
        description: `${lowMealDays} of the last 3 days had fewer than 2 meals logged.`,
        metadata: { lowMealDays },
      })
    } else if (lowMealDays >= 1) {
      detected.push({
        type: 'MISSED_MEALS',
        severity: 'MEDIUM',
        title: 'Missed Meals Detected',
        description: `${lowMealDays} of the last 3 days had fewer than 2 meals logged.`,
        metadata: { lowMealDays },
      })
    }

    // d) CONSECUTIVE_ABSENCE — longest streak
    const allAttendance = await prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { date: 'asc' },
    })

    let maxStreak = 0
    let currentStreak = 0
    const seenDates = new Set<string>()
    for (const record of allAttendance) {
      const dateKey = new Date(record.date).toISOString().split('T')[0]
      if (seenDates.has(dateKey)) continue
      seenDates.add(dateKey)

      if (record.status === AttendanceStatus.ABSENT) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    if (maxStreak >= 5) {
      detected.push({
        type: 'CONSECUTIVE_ABSENCE',
        severity: 'CRITICAL',
        title: 'Extended Consecutive Absences',
        description: `${maxStreak} consecutive days absent detected.`,
        metadata: { maxStreak },
      })
    } else if (maxStreak >= 3) {
      detected.push({
        type: 'CONSECUTIVE_ABSENCE',
        severity: 'HIGH',
        title: 'Consecutive Absences',
        description: `${maxStreak} consecutive days absent detected.`,
        metadata: { maxStreak },
      })
    }

    // e) GRADE_DROP — compare latest vs previous assessment per subject
    const marks = await prisma.markRecord.findMany({
      where: { studentId },
      include: { subject: true },
      orderBy: { publishedAt: 'desc' },
    })

    const marksBySubject = marks.reduce((acc, m) => {
      if (!acc[m.subjectId]) acc[m.subjectId] = []
      acc[m.subjectId].push(m)
      return acc
    }, {} as Record<string, typeof marks>)

    let worstDrop = 0
    let worstSubject = ''

    for (const [, subjectMarks] of Object.entries(marksBySubject)) {
      if (subjectMarks.length < 2) continue
      const latest = subjectMarks[0]
      const previous = subjectMarks[1]
      const latestPct = (latest.score / latest.maxScore) * 100
      const previousPct = (previous.score / previous.maxScore) * 100
      const drop = previousPct - latestPct

      if (drop > worstDrop) {
        worstDrop = drop
        worstSubject = latest.subject.name
      }
    }

    if (worstDrop > 20) {
      detected.push({
        type: 'GRADE_DROP',
        severity: 'HIGH',
        title: 'Significant Grade Drop',
        description: `${worstSubject} score dropped by ${Math.round(worstDrop)} percentage points.`,
        metadata: { worstDrop: Math.round(worstDrop), worstSubject },
      })
    }

    // f) UNUSUAL_LOCATION — count alerts in last 7 days
    const locationAlerts = await prisma.locationAlert.count({
      where: { studentId, createdAt: { gte: sevenDaysAgo } },
    })

    if (locationAlerts > 5) {
      detected.push({
        type: 'UNUSUAL_LOCATION',
        severity: 'HIGH',
        title: 'Frequent Location Alerts',
        description: `${locationAlerts} location alerts in the last 7 days.`,
        metadata: { alertCount: locationAlerts },
      })
    } else if (locationAlerts > 3) {
      detected.push({
        type: 'UNUSUAL_LOCATION',
        severity: 'MEDIUM',
        title: 'Location Alerts Detected',
        description: `${locationAlerts} location alerts in the last 7 days.`,
        metadata: { alertCount: locationAlerts },
      })
    }

    // Upsert detected anomalies
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + 7)

    for (const anomaly of detected) {
      try {
        const metaJson = anomaly.metadata ? JSON.parse(JSON.stringify(anomaly.metadata)) : null
        await prisma.anomaly.upsert({
          where: { studentId_type: { studentId, type: anomaly.type } },
          create: {
            studentId,
            type: anomaly.type,
            severity: anomaly.severity,
            title: anomaly.title,
            description: anomaly.description,
            ...(metaJson ? { metadata: metaJson } : {}),
            expiresAt,
          },
          update: {
            severity: anomaly.severity,
            title: anomaly.title,
            description: anomaly.description,
            ...(metaJson ? { metadata: metaJson } : {}),
            detectedAt: now,
            expiresAt,
            isDismissed: false,
          },
        })
      } catch (e) {
        console.error('Anomaly upsert error:', anomaly.type, e)
      }
    }
  }

  // Return all active anomalies for this parent's students
  const anomalies = await prisma.anomaly.findMany({
    where: {
      studentId: { in: studentIds },
      isDismissed: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { student: { select: { id: true, name: true, registerNumber: true } } },
    orderBy: { detectedAt: 'desc' },
  })

  // Sort by severity: CRITICAL first, then HIGH, MEDIUM, LOW
  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  anomalies.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))

  return { anomalies }
}

// ── Predictive Analytics ──

export async function getParentPredictions(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: { students: { where: { status: 'ACTIVE' } } },
  })
  if (!parent || parent.students.length === 0) return null

  const studentId = parent.students[0].id
  const now = new Date()

  // a) Attendance forecast — weekly rates with linear regression
  const allAttendance = await prisma.attendanceRecord.findMany({
    where: { studentId },
    orderBy: { date: 'asc' },
  })

  const weeklyAttendance: { week: string; rate: number; total: number; present: number; isForecast: boolean }[] = []

  if (allAttendance.length > 0) {
    // Group by week (Sunday-based)
    const weekMap = new Map<string, { total: number; present: number }>()
    for (const record of allAttendance) {
      const d = new Date(record.date)
      const weekStart = new Date(d)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weekMap.has(weekKey)) weekMap.set(weekKey, { total: 0, present: 0 })
      const w = weekMap.get(weekKey)!
      w.total++
      if (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.OD) {
        w.present++
      }
    }

    const sortedWeeks = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b))
    const weeklyRates = sortedWeeks.map(([, v]) => (v.total > 0 ? (v.present / v.total) * 100 : 0))

    for (let i = 0; i < sortedWeeks.length; i++) {
      const [weekKey, v] = sortedWeeks[i]
      weeklyAttendance.push({
        week: weekKey,
        rate: Math.round(weeklyRates[i] * 10) / 10,
        total: v.total,
        present: v.present,
        isForecast: false,
      })
    }

    // Forecast 4 weeks ahead using linear regression
    if (weeklyRates.length >= 2) {
      const reg = linearRegression(weeklyRates)
      const lastWeekDate = new Date(sortedWeeks[sortedWeeks.length - 1][0])

      for (let i = 1; i <= 4; i++) {
        const forecastDate = new Date(lastWeekDate)
        forecastDate.setDate(forecastDate.getDate() + 7 * i)
        const forecastRate = Math.max(0, Math.min(100, reg.slope * (weeklyRates.length - 1 + i) + reg.intercept))

        weeklyAttendance.push({
          week: forecastDate.toISOString().split('T')[0],
          rate: Math.round(forecastRate * 10) / 10,
          total: 0,
          present: 0,
          isForecast: true,
        })
      }
    }
  }

  // b) GPA prediction
  const allMarks = await prisma.markRecord.findMany({
    where: { studentId },
    include: { subject: true },
    orderBy: { publishedAt: 'desc' },
  })

  const subjectGrades: { subject: string; subjectCode: string; currentScore: number; predictedScore: number; assessments: { type: string; score: number; maxScore: number }[] }[] = []

  const marksBySubject = allMarks.reduce((acc, m) => {
    if (!acc[m.subjectId]) acc[m.subjectId] = { subject: m.subject, marks: [] }
    acc[m.subjectId].marks.push(m)
    return acc
  }, {} as Record<string, { subject: typeof allMarks[0]['subject']; marks: typeof allMarks }>)

  for (const [, { subject, marks: subjectMarks }] of Object.entries(marksBySubject)) {
    const internalTypes = ['INTERNAL_1', 'INTERNAL_2', 'INTERNAL_3']
    const majorTypes = ['MODEL_EXAM', 'SEMESTER_EXAM']

    const internals = subjectMarks.filter((m) => internalTypes.includes(m.assessmentType))
    const majors = subjectMarks.filter((m) => majorTypes.includes(m.assessmentType))

    let currentScore = 0
    let predictedScore: number | null = null

    if (majors.length > 0 && internals.length > 0) {
      // Weighted average: internals 0.3, majors 0.7
      const internalAvg = internals.reduce((s, m) => s + (m.score / m.maxScore) * 100, 0) / internals.length
      const majorAvg = majors.reduce((s, m) => s + (m.score / m.maxScore) * 100, 0) / majors.length
      currentScore = internalAvg * 0.3 + majorAvg * 0.7
    } else if (internals.length > 0) {
      // Only internals exist — project semester score
      const internalAvg = internals.reduce((s, m) => s + (m.score / m.maxScore) * 100, 0) / internals.length
      currentScore = internalAvg
      // Project: assume semester performance is typically 90% of internal average
      predictedScore = internalAvg * 0.9
    } else if (majors.length > 0) {
      currentScore = majors.reduce((s, m) => s + (m.score / m.maxScore) * 100, 0) / majors.length
    }

    // Map to 10-point GPA scale
    const gpaScore = Math.round(currentScore) / 10
    const gpaPredicted = predictedScore !== null ? Math.round(predictedScore) / 10 : gpaScore

    subjectGrades.push({
      subject: subject.name,
      subjectCode: subject.code,
      currentScore: Math.round(gpaScore * 10) / 10,
      predictedScore: Math.round(gpaPredicted * 10) / 10,
      assessments: subjectMarks.map((m) => ({
        type: m.assessmentType,
        score: m.score,
        maxScore: m.maxScore,
      })),
    })
  }

  const overallGPA = subjectGrades.length > 0
    ? Math.round((subjectGrades.reduce((s, g) => s + g.currentScore, 0) / subjectGrades.length) * 10) / 10
    : 0

  // c) Fee prediction — risk classification based on payment patterns
  const allFees = await prisma.feeRecord.findMany({
    where: { studentId },
    orderBy: { dueDate: 'asc' },
  })

  const paidFees = allFees.filter((f) => f.status === 'PAID')
  const totalPaid = paidFees.length
  const latePaid = paidFees.filter((f) => f.paidAt && f.paidAt > f.dueDate).length
  const lateRatio = totalPaid > 0 ? latePaid / totalPaid : 0

  const feePredictions = allFees
    .filter((f) => f.status === 'PENDING' || f.status === 'OVERDUE' || f.status === 'PARTIAL')
    .map((fee) => {
      let risk: 'on-track' | 'at-risk' | 'overdue' = 'on-track'
      if (fee.status === 'OVERDUE') {
        risk = 'overdue'
      } else if (lateRatio > 0.5) {
        risk = 'at-risk'
      } else if (fee.dueDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) && lateRatio > 0.25) {
        risk = 'at-risk'
      }

      return {
        id: fee.id,
        term: fee.term,
        description: fee.description,
        totalAmount: fee.totalAmount,
        paidAmount: fee.paidAmount,
        dueDate: fee.dueDate,
        status: fee.status,
        risk,
      }
    })

  // d) Meal regularity — weekly meals/day with forecast
  const fourWeeksAgo = new Date(now)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const recentFoodLogs = await prisma.foodLog.findMany({
    where: { studentId, loggedAt: { gte: fourWeeksAgo } },
    orderBy: { loggedAt: 'asc' },
  })

  const mealWeekMap = new Map<string, number>()
  const mealWeekDays = new Map<string, Set<string>>()

  for (const log of recentFoodLogs) {
    const d = new Date(log.loggedAt)
    const weekStart = new Date(d)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    const dayKey = d.toISOString().split('T')[0]

    mealWeekMap.set(weekKey, (mealWeekMap.get(weekKey) || 0) + 1)
    if (!mealWeekDays.has(weekKey)) mealWeekDays.set(weekKey, new Set())
    mealWeekDays.get(weekKey)!.add(dayKey)
  }

  const sortedMealWeeks = Array.from(mealWeekMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  const mealsPerDayByWeek = sortedMealWeeks.map(([weekKey, count]) => {
    const days = mealWeekDays.get(weekKey)?.size || 7
    return count / Math.max(days, 1)
  })

  const mealForecast: { week: string; mealsPerDay: number; isForecast: boolean }[] = []

  for (let i = 0; i < sortedMealWeeks.length; i++) {
    mealForecast.push({
      week: sortedMealWeeks[i][0],
      mealsPerDay: Math.round(mealsPerDayByWeek[i] * 10) / 10,
      isForecast: false,
    })
  }

  // Forecast 2 weeks ahead using linear regression
  if (mealsPerDayByWeek.length >= 2) {
    const reg = linearRegression(mealsPerDayByWeek)
    const lastWeekDate = new Date(sortedMealWeeks[sortedMealWeeks.length - 1][0])

    for (let i = 1; i <= 2; i++) {
      const forecastDate = new Date(lastWeekDate)
      forecastDate.setDate(forecastDate.getDate() + 7 * i)
      const forecastValue = Math.max(0, reg.slope * (mealsPerDayByWeek.length - 1 + i) + reg.intercept)

      mealForecast.push({
        week: forecastDate.toISOString().split('T')[0],
        mealsPerDay: Math.round(forecastValue * 10) / 10,
        isForecast: true,
      })
    }
  }

  return {
    studentId,
    studentName: parent.students[0].name,
    attendance: {
      weeklyData: weeklyAttendance,
      trend: weeklyAttendance.length >= 2
        ? linearRegression(weeklyAttendance.filter((w) => !w.isForecast).map((w) => w.rate)).slope > 0
          ? 'improving'
          : 'declining'
        : 'stable',
    },
    grades: {
      overallGPA,
      subjects: subjectGrades,
    },
    fees: {
      predictions: feePredictions,
      paymentHistory: { totalPaid, latePaid, lateRatio: Math.round(lateRatio * 100) },
    },
    meals: {
      forecast: mealForecast,
      trend: mealsPerDayByWeek.length >= 2
        ? linearRegression(mealsPerDayByWeek).slope > 0
          ? 'improving'
          : 'declining'
        : 'stable',
    },
  }
}
