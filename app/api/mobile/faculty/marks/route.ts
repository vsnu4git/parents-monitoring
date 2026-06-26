import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const marksSchema = z.object({
  subjectId: z.string(),
  assessmentType: z.enum([
    'INTERNAL_1',
    'INTERNAL_2',
    'INTERNAL_3',
    'MODEL_EXAM',
    'SEMESTER_EXAM',
    'ASSIGNMENT',
    'QUIZ',
    'LAB',
  ]),
  maxScore: z.number().positive(),
  records: z.array(
    z.object({
      studentId: z.string(),
      score: z.number().min(0),
      remarks: z.string().optional(),
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
    const parsed = marksSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { subjectId, assessmentType, maxScore, records } = parsed.data

    // Validate: admin can enter marks for any subject, faculty must be assigned
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

    // Validate scores don't exceed maxScore
    const invalidScores = records.filter((r) => r.score > maxScore)
    if (invalidScores.length > 0) {
      return Response.json(
        { error: `Some scores exceed maxScore (${maxScore})` },
        { status: 400 }
      )
    }

    // Create mark records
    const results = await prisma.markRecord.createMany({
      data: records.map((record) => ({
        studentId: record.studentId,
        subjectId,
        assessmentType,
        score: record.score,
        maxScore,
        remarks: record.remarks || null,
      })),
    })

    return Response.json({ saved: results.count })
  } catch (error) {
    console.error('Enter marks error:', error)
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
    const assessmentType = searchParams.get('assessmentType')

    if (!subjectId || !assessmentType) {
      return Response.json(
        { error: 'subjectId and assessmentType are required' },
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

    // Get all students for this subject
    const students = await prisma.student.findMany({
      where: {
        departmentId: facultySubject.subject.departmentId,
        semester: facultySubject.subject.semester,
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
    })

    // Get mark records
    const markRecords = await prisma.markRecord.findMany({
      where: {
        subjectId,
        assessmentType: assessmentType as any,
        studentId: { in: students.map((s) => s.id) },
      },
    })

    const marksMap = new Map(
      markRecords.map((r) => [
        r.studentId,
        { score: r.score, maxScore: r.maxScore, remarks: r.remarks },
      ])
    )

    const result = students.map((s) => ({
      studentId: s.id,
      registerNumber: s.registerNumber,
      name: s.name,
      section: s.section,
      marks: marksMap.get(s.id) || null,
    }))

    return Response.json({ marks: result })
  } catch (error) {
    console.error('Get marks error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
