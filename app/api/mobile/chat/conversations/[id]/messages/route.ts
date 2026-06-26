import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { getConversationMessages, sendChatMessage } from '@/lib/data/mobile.data'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const messages = await getConversationMessages(id, parent.id)
    if (messages === null) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return Response.json(messages)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { content } = await req.json()
    if (!content?.trim()) {
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    // Verify conversation belongs to this parent
    const conversation = await prisma.conversation.findFirst({
      where: { id, parentId: parent.id },
    })
    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const message = await sendChatMessage(id, auth.userId, auth.role, content.trim())
    return Response.json(message, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
