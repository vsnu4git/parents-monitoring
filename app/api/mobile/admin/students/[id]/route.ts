import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const updateStudentSchema = z.object({
  year: z.number().min(1).max(4).optional(),
  semester: z.number().min(1).max(8).optional(),
  section: z.string().min(1).max(5).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'DROPPED']).optional(),
  parentId: z.string().nullable().optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        department: true,
        parent: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
      },
    })

    if (!student) {
      return Response.json({ error: 'Student not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Attendance stats
    const [totalAttendance, presentCount] = await Promise.all([
      prisma.attendanceRecord.count({ where: { studentId: id } }),
      prisma.attendanceRecord.count({ where: { studentId: id, status: 'PRESENT' } }),
    ])

    // Recent marks
    const marks = await prisma.markRecord.findMany({
      where: { studentId: id },
      include: { subject: { select: { id: true, code: true, name: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    })

    // Fee records
    const fees = await prisma.feeRecord.findMany({
      where: { studentId: id },
      orderBy: { dueDate: 'desc' },
    })

    return Response.json({
      student,
      attendance: {
        total: totalAttendance,
        present: presentCount,
        percentage: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0,
      },
      marks,
      fees,
    })
  } catch (error) {
    console.error('Get student detail error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateStudentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.student.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Student not found' }, { status: 404 })
    }

    const student = await prisma.student.update({
      where: { id },
      data: parsed.data,
      include: {
        department: true,
        parent: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
      },
    })

    return Response.json(student)
  } catch (error) {
    console.error('Update student error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
