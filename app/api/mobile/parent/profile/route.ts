import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getParentWithStudentsByUserId } from '@/lib/data/mobile.data'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await getParentWithStudentsByUserId(auth.userId)
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })
    return Response.json(parent)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
