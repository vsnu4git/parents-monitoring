import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const { id } = await params
    // Verify user can reply to this ticket
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    // For parents: verify ownership
    if (session.user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
      if (!parent || ticket.parentId !== parent.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: id,
        senderId: session.user.id,
        senderRole: session.user.role as any,
        message: message.trim(),
      }
    })

    return NextResponse.json(reply)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
