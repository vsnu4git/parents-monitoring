import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const conversation = await prisma.conversation.findFirst({
      where: { id, parentId: parent.id },
    })
    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const result = await prisma.chatMessage.updateMany({
      where: { conversationId: id, isRead: false, senderRole: { not: 'PARENT' } },
      data: { isRead: true },
    })

    return Response.json({ success: true, markedRead: result.count })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
