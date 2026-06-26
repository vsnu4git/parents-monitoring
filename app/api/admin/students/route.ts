import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'
import * as bcrypt from 'bcryptjs'

const createStudentSchema = z.object({
  // Student fields
  name: z.string().min(2),
  registerNumber: z.string().min(3),
  departmentId: z.string(),
  year: z.number().min(1).max(4),
  semester: z.number().min(1).max(8),
  section: z.string().min(1).max(5),
  dateOfBirth: z.string().optional(),
  // Parent fields (optional - create new or link existing)
  parentId: z.string().optional(), // link to existing parent
  // OR create new parent:
  parentName: z.string().optional(),
  parentEmail: z.email().optional(),
  parentPhone: z.string().optional(),
  parentRelation: z.string().optional(),
  parentOccupation: z.string().optional(),
  parentPassword: z.string().min(6).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Create new parent if parent details provided
    if (!parentId && data.parentName && data.parentEmail && data.parentPassword) {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email: data.parentEmail } })
      if (existingUser) {
        // If user exists and is a parent, link to them
        const existingParent = await prisma.parent.findUnique({ where: { userId: existingUser.id } })
        if (existingParent) {
          parentId = existingParent.id
        } else {
          return Response.json({ error: 'Email already in use by a non-parent account' }, { status: 409 })
        }
      } else {
        const passwordHash = await bcrypt.hash(data.parentPassword, 10)
        const newUser = await prisma.user.create({
          data: {
            name: data.parentName,
            email: data.parentEmail,
            phone: data.parentPhone || null,
            passwordHash,
            role: 'PARENT',
          },
        })
        const newParent = await prisma.parent.create({
          data: {
            userId: newUser.id,
            relation: data.parentRelation || 'Father',
            occupation: data.parentOccupation || null,
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
      include: { department: true, parent: { include: { user: true } } },
    })

    return Response.json(student, { status: 201 })
  } catch (error) {
    console.error('Create student error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
