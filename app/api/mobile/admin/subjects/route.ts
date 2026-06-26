import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const createSubjectSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  departmentId: z.string(),
  semester: z.number().min(1).max(8),
  credits: z.number().min(1).max(10).optional(),
})

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const departmentId = searchParams.get('departmentId')
    const semester = searchParams.get('semester')

    const where: Record<string, unknown> = {}
    if (departmentId) where.departmentId = departmentId
    if (semester) where.semester = parseInt(semester)

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        department: true,
        facultySubjects: {
          include: {
            faculty: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: [{ department: { code: 'asc' } }, { semester: 'asc' }, { code: 'asc' }],
    })

    return Response.json({ subjects })
  } catch (error) {
    console.error('List subjects error:', error)
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
    const parsed = createSubjectSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Check code uniqueness
    const existing = await prisma.subject.findUnique({ where: { code: data.code } })
    if (existing) {
      return Response.json({ error: 'Subject code already exists' }, { status: 409 })
    }

    // Verify department exists
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } })
    if (!dept) {
      return Response.json({ error: 'Department not found' }, { status: 404 })
    }

    const subject = await prisma.subject.create({
      data: {
        code: data.code,
        name: data.name,
        departmentId: data.departmentId,
        semester: data.semester,
        credits: data.credits ?? 3,
      },
      include: { department: true },
    })

    return Response.json(subject, { status: 201 })
  } catch (error) {
    console.error('Create subject error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
