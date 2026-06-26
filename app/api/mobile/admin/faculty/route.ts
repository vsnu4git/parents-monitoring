import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'
import * as bcrypt from 'bcryptjs'

const createFacultySchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  department: z.string(),
  designation: z.string().optional(),
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
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (department) {
      where.department = department
    }
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const faculty = await prisma.faculty.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        subjects: {
          include: {
            subject: { include: { department: true } },
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    })

    return Response.json({ faculty })
  } catch (error) {
    console.error('List faculty error:', error)
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
    const parsed = createFacultySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: 'FACULTY',
      },
    })

    const faculty = await prisma.faculty.create({
      data: {
        userId: user.id,
        department: data.department,
        designation: data.designation || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        subjects: { include: { subject: true } },
      },
    })

    return Response.json(faculty, { status: 201 })
  } catch (error) {
    console.error('Create faculty error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
