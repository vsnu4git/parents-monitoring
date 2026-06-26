import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getActiveAlertsWithAck } from '@/lib/data/mobile.data'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const alerts = await getActiveAlertsWithAck(auth.userId)
    return Response.json(alerts)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
