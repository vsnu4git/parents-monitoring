import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getStudentIDCardData } from '@/lib/data/mobile.data'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const data = await getStudentIDCardData(id)
    if (!data) return Response.json({ error: 'Student not found' }, { status: 404 })
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
