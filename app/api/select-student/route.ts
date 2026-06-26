import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { studentId } = await req.json()
  if (!studentId || typeof studentId !== 'string') {
    return Response.json({ error: 'studentId required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set('pms-selected-student', studentId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: 'lax',
  })

  return Response.json({ ok: true })
}
