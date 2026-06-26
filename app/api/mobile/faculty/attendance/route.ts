import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const attendanceSchema = z.object({
  subjectId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'OD', 'LEAVE', 'HOLIDAY']),
    })
  ),
})

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = attendanceSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { subjectId, date, records } = parsed.data

    // Validate: admin can mark any subject, faculty must be assigned
    const isAdmin = auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN'

    if (!isAdmin) {
      const faculty = await prisma.faculty.findUnique({ where: { userId: auth.userId } })
      if (!faculty) return Response.json({ error: 'Faculty not found' }, { status: 404 })

      const facultySubject = await prisma.facultySubject.findUnique({
        where: { facultyId_subjectId: { facultyId: faculty.id, subjectId } },
      })
      if (!facultySubject) {
        return Response.json({ error: 'You are not assigned to this subject' }, { status: 403 })
      }
    }

    // Upsert attendance records
    const attendanceDate = new Date(date + 'T00:00:00.000Z')

    const results = await Promise.all(
      records.map((record) =>
        prisma.attendanceRecord.upsert({
          where: {
            studentId_subjectId_date: {
              studentId: record.studentId,
              subjectId,
              date: attendanceDate,
            },
          },
          update: {
            status: record.status,
          },
          create: {
            studentId: record.studentId,
            subjectId,
            date: attendanceDate,
            status: record.status,
          },
        })
      )
    )

    return Response.json({ saved: results.length })
  } catch (error) {
    console.error('Mark attendance error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subjectId')
    const date = searchParams.get('date')

    if (!subjectId || !date) {
      return Response.json(
        { error: 'subjectId and date are required' },
        { status: 400 }
      )
    }

    // Validate faculty teaches this subject
    const faculty = await prisma.faculty.findUnique({
      where: { userId: auth.userId },
    })

    if (!faculty) {
      return Response.json({ error: 'Faculty not found' }, { status: 404 })
    }

    const facultySubject = await prisma.facultySubject.findUnique({
      where: {
        facultyId_subjectId: {
          facultyId: faculty.id,
          subjectId,
        },
      },
      include: { subject: true },
    })

    if (!facultySubject) {
      return Response.json(
        { error: 'You are not assigned to this subject' },
        { status: 403 }
      )
    }

    const attendanceDate = new Date(date + 'T00:00:00.000Z')

    // Get all students for this subject's department + semester
    const students = await prisma.student.findMany({
      where: {
        departmentId: facultySubject.subject.departmentId,
        semester: facultySubject.subject.semester,
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
    })

    // Get attendance records for the date
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        subjectId,
        date: attendanceDate,
        studentId: { in: students.map((s) => s.id) },
      },
    })

    const attendanceMap = new Map(
      attendanceRecords.map((r) => [r.studentId, r.status])
    )

    const result = students.map((s) => ({
      studentId: s.id,
      registerNumber: s.registerNumber,
      name: s.name,
      section: s.section,
      status: attendanceMap.get(s.id) || null,
    }))

    return Response.json({ attendance: result })
  } catch (error) {
    console.error('Get attendance error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
