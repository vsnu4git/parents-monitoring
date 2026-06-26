import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getTicketById } from '@/lib/data/mobile.data'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const ticket = await getTicketById(id, auth.userId)
    if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 })
    return Response.json(ticket)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
