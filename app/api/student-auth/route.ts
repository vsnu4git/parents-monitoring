import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

const JWT_SECRET = process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-dev-secret'

const loginSchema = z.object({
  registerNumber: z.string().min(1),
  password: z.string().min(4),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid credentials' }, { status: 400 })

    const student = await prisma.student.findUnique({
      where: { registerNumber: parsed.data.registerNumber },
      include: { department: true },
    })

    if (!student || student.status !== 'ACTIVE') {
      return Response.json({ error: 'Invalid register number or password' }, { status: 401 })
    }

    // Password check: accept "student123" or DOB in DDMMYYYY format
    const dob = student.dateOfBirth
    const dobPassword = dob
      ? `${String(dob.getDate()).padStart(2, '0')}${String(dob.getMonth() + 1).padStart(2, '0')}${dob.getFullYear()}`
      : null

    if (parsed.data.password !== 'student123' && parsed.data.password !== dobPassword) {
      return Response.json({ error: 'Invalid register number or password' }, { status: 401 })
    }

    const token = jwt.sign(
      { studentId: student.id, registerNumber: student.registerNumber, role: 'STUDENT' },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    const cookieStore = await cookies()
    cookieStore.set('pms-student-token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax',
    })

    return Response.json({
      student: {
        id: student.id,
        name: student.name,
        registerNumber: student.registerNumber,
        department: student.department,
        year: student.year,
        semester: student.semester,
        section: student.section,
      },
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('pms-student-token')
  return Response.json({ ok: true })
}
