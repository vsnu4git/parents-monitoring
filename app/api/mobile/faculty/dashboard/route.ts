import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const isAdmin = auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN'

    // For faculty: look up their record. For admin: create a virtual one.
    const faculty = await prisma.faculty.findUnique({
      where: { userId: auth.userId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        subjects: { include: { subject: { include: { department: true } } } },
      },
    })

    // Admin without faculty record — show all subjects
    if (!faculty && !isAdmin) {
      return Response.json({ error: 'Faculty not found' }, { status: 404 })
    }

    const user = faculty
      ? faculty.user
      : await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { id: true, name: true, email: true, phone: true },
        })

    // Get subjects: faculty sees their assigned subjects, admin sees all
    let subjectIds: string[]
    let departmentFilter: string | undefined

    if (faculty) {
      subjectIds = faculty.subjects.map((fs) => fs.subjectId)
      departmentFilter = faculty.department
    } else {
      // Admin: get all subjects
      const allSubjects = await prisma.subject.findMany({ select: { id: true } })
      subjectIds = allSubjects.map((s) => s.id)
      departmentFilter = undefined
    }

    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      include: { department: true },
    })

    const subjectsWithCounts = await Promise.all(
      subjects.map(async (sub) => {
        const studentCount = await prisma.student.count({
          where: { departmentId: sub.departmentId, semester: sub.semester, status: 'ACTIVE' },
        })
        return {
          id: sub.id, code: sub.code, name: sub.name,
          semester: sub.semester, credits: sub.credits,
          department: sub.department, studentCount,
        }
      })
    )

    // Today's marked classes
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysClasses = await prisma.attendanceRecord.findMany({
      where: { subjectId: { in: subjectIds }, date: { gte: today, lt: tomorrow } },
      select: { subjectId: true },
      distinct: ['subjectId'],
    })

    // Pending leaves count
    const pendingLeavesCount = await prisma.leaveRecord.count({
      where: {
        status: 'PENDING',
        student: {
          status: 'ACTIVE',
          ...(departmentFilter ? { department: { code: departmentFilter } } : {}),
        },
      },
    })

    // Total students
    const totalStudents = await prisma.student.count({
      where: {
        status: 'ACTIVE',
        ...(departmentFilter ? { department: { code: departmentFilter } } : {}),
      },
    })

    return Response.json({
      faculty: {
        id: faculty?.id || 'admin',
        department: faculty?.department || 'All Departments',
        designation: faculty?.designation || (isAdmin ? 'Administrator' : ''),
        user,
      },
      subjects: subjectsWithCounts,
      todaysClassesMarked: todaysClasses.map((c) => c.subjectId),
      pendingLeaves: pendingLeavesCount,
      totalStudents,
      isAdmin,
    })
  } catch (error) {
    console.error('Faculty dashboard error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
