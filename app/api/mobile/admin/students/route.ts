import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'
import * as bcrypt from 'bcryptjs'

const createStudentSchema = z.object({
  name: z.string().min(2),
  registerNumber: z.string().min(3),
  departmentId: z.string(),
  year: z.number().min(1).max(4),
  semester: z.number().min(1).max(8),
  section: z.string().min(1).max(5),
  dateOfBirth: z.string().optional(),
  parentId: z.string().optional(),
  // Create parent inline
  createParent: z
    .object({
      parentName: z.string().min(2),
      parentEmail: z.email(),
      parentPhone: z.string().optional(),
      parentPassword: z.string().min(6),
      relation: z.string().optional(),
    })
    .optional(),
})

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const department = searchParams.get('department')
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}

    if (department) {
      where.department = { code: department }
    }
    if (year) {
      where.year = parseInt(year)
    }
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { registerNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          department: true,
          parent: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.student.count({ where }),
    ])

    return Response.json({ students, total, page, limit })
  } catch (error) {
    console.error('List students error:', error)
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
    const parsed = createStudentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Check register number uniqueness
    const existing = await prisma.student.findUnique({ where: { registerNumber: data.registerNumber } })
    if (existing) {
      return Response.json({ error: 'Register number already exists' }, { status: 409 })
    }

    let parentId = data.parentId || null

    // Create parent if createParent is provided
    if (!parentId && data.createParent) {
      const cp = data.createParent
      const existingUser = await prisma.user.findUnique({ where: { email: cp.parentEmail } })

      if (existingUser) {
        const existingParent = await prisma.parent.findUnique({ where: { userId: existingUser.id } })
        if (existingParent) {
          parentId = existingParent.id
        } else {
          return Response.json({ error: 'Email already in use by a non-parent account' }, { status: 409 })
        }
      } else {
        const passwordHash = await bcrypt.hash(cp.parentPassword, 10)
        const newUser = await prisma.user.create({
          data: {
            name: cp.parentName,
            email: cp.parentEmail,
            phone: cp.parentPhone || null,
            passwordHash,
            role: 'PARENT',
          },
        })
        const newParent = await prisma.parent.create({
          data: {
            userId: newUser.id,
            relation: cp.relation || 'Father',
          },
        })
        parentId = newParent.id
      }
    }

    const student = await prisma.student.create({
      data: {
        name: data.name,
        registerNumber: data.registerNumber,
        departmentId: data.departmentId,
        year: data.year,
        semester: data.semester,
        section: data.section,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        parentId,
      },
      include: {
        department: true,
        parent: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
      },
    })

    return Response.json(student, { status: 201 })
  } catch (error) {
    console.error('Create student error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
