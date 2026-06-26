import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-dev-secret'

interface StudentTokenPayload {
  studentId: string
  registerNumber: string
  role: 'STUDENT'
}

export async function getStudentSession(): Promise<StudentTokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('pms-student-token')?.value
  if (!token) return null

  try {
    const payload = jwt.verify(token, JWT_SECRET) as StudentTokenPayload
    if (payload.role !== 'STUDENT') return null
    return payload
  } catch {
    return null
  }
}
