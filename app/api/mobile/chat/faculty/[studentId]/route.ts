import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getStudentFacultyList, verifyStudentBelongsToParent } from '@/lib/data/mobile.data'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { studentId } = await params

  try {
    const parent = await verifyStudentBelongsToParent(studentId, auth.userId)
    if (!parent) {
      return Response.json({ error: 'Student not found' }, { status: 404 })
    }

    const faculty = await getStudentFacultyList(studentId)
    return Response.json(faculty)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
