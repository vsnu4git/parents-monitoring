import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const createDepartmentSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(2),
})

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            students: { where: { status: 'ACTIVE' } },
            subjects: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Get faculty counts per department
    const facultyCounts = await prisma.faculty.groupBy({
      by: ['department'],
      _count: { id: true },
    })
    const facultyCountMap: Record<string, number> = {}
    for (const fc of facultyCounts) {
      facultyCountMap[fc.department] = fc._count.id
    }

    const result = departments.map((dept) => ({
      id: dept.id,
      code: dept.code,
      name: dept.name,
      studentCount: dept._count.students,
      subjectCount: dept._count.subjects,
      facultyCount: facultyCountMap[dept.code] || 0,
    }))

    return Response.json({ departments: result })
  } catch (error) {
    console.error('List departments error:', error)
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
    const parsed = createDepartmentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    // Check code uniqueness
    const existing = await prisma.department.findUnique({ where: { code: parsed.data.code } })
    if (existing) {
      return Response.json({ error: 'Department code already exists' }, { status: 409 })
    }

    const department = await prisma.department.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
      },
    })

    return Response.json(department, { status: 201 })
  } catch (error) {
    console.error('Create department error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
