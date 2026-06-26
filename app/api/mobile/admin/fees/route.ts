import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const createFeeSchema = z.object({
  studentId: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
  term: z.string(),
  description: z.string().optional(),
  totalAmount: z.number().positive(),
  dueDate: z.string(),
})

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const term = searchParams.get('term')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = studentId
    if (status) where.status = status
    if (term) where.term = term

    const [fees, total] = await Promise.all([
      prisma.feeRecord.findMany({
        where,
        include: {
          student: {
            select: { id: true, name: true, registerNumber: true, department: { select: { code: true, name: true } } },
          },
        },
        orderBy: { dueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feeRecord.count({ where }),
    ])

    return Response.json({ fees, total, page, limit })
  } catch (error) {
    console.error('List fees error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = createFeeSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Determine target student IDs
    const targetIds: string[] = []
    if (data.studentIds && data.studentIds.length > 0) {
      targetIds.push(...data.studentIds)
    } else if (data.studentId) {
      targetIds.push(data.studentId)
    } else {
      return Response.json({ error: 'Either studentId or studentIds is required' }, { status: 400 })
    }

    // Verify all students exist
    const existingStudents = await prisma.student.findMany({
      where: { id: { in: targetIds } },
      select: { id: true },
    })

    if (existingStudents.length !== targetIds.length) {
      return Response.json({ error: 'One or more student IDs are invalid' }, { status: 400 })
    }

    const dueDate = new Date(data.dueDate)

    // Bulk create fee records
    const feeRecords = await prisma.feeRecord.createMany({
      data: targetIds.map((sid) => ({
        studentId: sid,
        term: data.term,
        description: data.description || null,
        totalAmount: data.totalAmount,
        dueDate,
      })),
    })

    return Response.json({ created: feeRecords.count }, { status: 201 })
  } catch (error) {
    console.error('Create fee error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
