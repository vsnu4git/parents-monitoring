import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const feeCreateSchema = z.object({
  studentId: z.string(),
  term: z.string(),
  description: z.string().optional(),
  totalAmount: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')

    const where: any = {}
    if (studentId) where.studentId = studentId
    if (status) where.status = status

    const fees = await prisma.feeRecord.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            registerNumber: true,
            semester: true,
            department: { select: { code: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return Response.json({
      fees: fees.map((f) => ({
        id: f.id,
        term: f.term,
        description: f.description,
        totalAmount: f.totalAmount,
        paidAmount: f.paidAmount,
        dueDate: f.dueDate,
        status: f.status,
        paidAt: f.paidAt,
        createdAt: f.createdAt,
        student: f.student,
      })),
    })
  } catch (error) {
    console.error('Get fees error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = feeCreateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { studentId, term, description, totalAmount, dueDate } = parsed.data

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return Response.json({ error: 'Student not found' }, { status: 404 })
    }

    const fee = await prisma.feeRecord.create({
      data: {
        studentId,
        term,
        description: description || null,
        totalAmount,
        dueDate: new Date(dueDate + 'T00:00:00.000Z'),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            registerNumber: true,
          },
        },
      },
    })

    return Response.json({
      fee: {
        id: fee.id,
        term: fee.term,
        description: fee.description,
        totalAmount: fee.totalAmount,
        paidAmount: fee.paidAmount,
        dueDate: fee.dueDate,
        status: fee.status,
        student: fee.student,
      },
    })
  } catch (error) {
    console.error('Create fee error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
