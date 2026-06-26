import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getStudentAttendanceSummary, verifyStudentBelongsToParent } from '@/lib/data/mobile.data'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const isOwnStudent = auth.userId === id
    const parent = !isOwnStudent ? await verifyStudentBelongsToParent(id, auth.userId) : true
    if (!parent && !isOwnStudent) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const attendance = await getStudentAttendanceSummary(id)
    return Response.json(attendance)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
