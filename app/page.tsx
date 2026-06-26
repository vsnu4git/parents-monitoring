import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getStudentSession } from '@/lib/student-auth'

export default async function HomePage() {
  // Check student session first (cookie-based)
  const studentSession = await getStudentSession()
  if (studentSession) redirect('/student')

  // Then check NextAuth session
  const session = await auth()
  if (!session) redirect('/login')
  const role = session.user.role
  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'FACULTY') redirect('/admin')
  redirect('/dashboard')
}
