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

    const faculty = await prisma.faculty.findUnique({
      where: { userId: auth.userId },
      include: { subjects: { include: { subject: true } } },
    })

    if (!faculty && !isAdmin) {
      return Response.json({ error: 'Faculty not found' }, { status: 404 })
    }

    // Build student query filter
    let studentWhere: any = { status: 'ACTIVE' as const }

    if (faculty) {
      // Faculty: students matching their subject department+semester combos
      const pairs = faculty.subjects.map((fs) => ({
        departmentId: fs.subject.departmentId,
        semester: fs.subject.semester,
      }))
      const uniquePairs = pairs.filter(
        (pair, i, self) =>
          i === self.findIndex((p) => p.departmentId === pair.departmentId && p.semester === pair.semester)
      )
      if (uniquePairs.length > 0) {
        studentWhere.OR = uniquePairs.map((pair) => ({
          departmentId: pair.departmentId,
          semester: pair.semester,
        }))
      }
    }
    // Admin: no extra filter, sees all active students

    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subjectId')
    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
      if (subject) {
        studentWhere = {
          status: 'ACTIVE' as const,
          departmentId: subject.departmentId,
          semester: subject.semester,
        }
      }
    }

    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        department: true,
      },
      orderBy: [
        { departmentId: 'asc' },
        { semester: 'asc' },
        { name: 'asc' },
      ],
    })

    return Response.json({
      students: students.map((s) => ({
        id: s.id,
        registerNumber: s.registerNumber,
        name: s.name,
        year: s.year,
        semester: s.semester,
        section: s.section,
        department: {
          id: s.department.id,
          code: s.department.code,
          name: s.department.name,
        },
      })),
    })
  } catch (error) {
    console.error('Faculty students error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
