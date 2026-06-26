import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { z } from 'zod/v4'

const JWT_SECRET = process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-dev-secret'

const loginSchema = z.object({
  registerNumber: z.string().min(1),
  // For demo: students use their DOB as password in DDMMYYYY format
  // In production this would be a proper password
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
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Password check: for demo, accept "student123" or DOB in DDMMYYYY format
    const dob = student.dateOfBirth
    const dobPassword = dob
      ? `${String(dob.getDate()).padStart(2, '0')}${String(dob.getMonth() + 1).padStart(2, '0')}${dob.getFullYear()}`
      : null

    if (parsed.data.password !== 'student123' && parsed.data.password !== dobPassword) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate JWT token for the student
    const token = jwt.sign(
      {
        userId: student.id, // use student ID as userId for the token
        studentId: student.id,
        registerNumber: student.registerNumber,
        role: 'STUDENT',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    return Response.json({
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.registerNumber, // use register number as identifier
        role: 'STUDENT',
      },
      student: {
        id: student.id,
        registerNumber: student.registerNumber,
        name: student.name,
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
