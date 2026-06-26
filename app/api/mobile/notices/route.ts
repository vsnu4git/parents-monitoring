import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getActiveNoticesWithAck } from '@/lib/data/mobile.data'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const notices = await getActiveNoticesWithAck(auth.userId)
    return Response.json(notices)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
