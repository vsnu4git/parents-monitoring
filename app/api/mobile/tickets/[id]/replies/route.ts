import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { message } = await req.json()
    if (!message?.trim()) return Response.json({ error: 'Message required' }, { status: 400 })

    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const ticket = await prisma.ticket.findFirst({
      where: { id, parentId: parent.id },
    })
    if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 })

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: id,
        senderId: auth.userId,
        senderRole: 'PARENT',
        message: message.trim(),
      },
    })

    return Response.json(reply, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
