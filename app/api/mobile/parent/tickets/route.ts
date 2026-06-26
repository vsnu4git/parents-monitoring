import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getParentTickets } from '@/lib/data/mobile.data'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const tickets = await getParentTickets(auth.userId)
    return Response.json(tickets)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
