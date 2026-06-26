import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getParentNotifications } from '@/lib/data/mobile.data'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const notifications = await getParentNotifications(auth.userId)
    return Response.json(notifications)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
