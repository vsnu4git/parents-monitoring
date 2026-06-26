import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json([])

    // Simple query - no nested includes that might fail
    const conversations = await prisma.conversation.findMany({
      where: { parentId: parent.id },
    })

    if (conversations.length === 0) return Response.json([])

    const result = []
    for (const conv of conversations) {
      const faculty = await prisma.faculty.findUnique({ where: { id: conv.facultyId } })
      const facultyUser = faculty ? await prisma.user.findUnique({ where: { id: faculty.userId }, select: { name: true } }) : null
      const student = await prisma.student.findUnique({ where: { id: conv.studentId }, select: { name: true } })
      const lastMsg = await prisma.chatMessage.findFirst({ where: { conversationId: conv.id }, orderBy: { createdAt: 'desc' } })

      result.push({
        id: conv.id,
        facultyName: facultyUser?.name || 'Faculty',
        facultyDepartment: faculty?.department || '',
        studentName: student?.name || '',
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: conv.lastMessageAt ?? conv.updatedAt,
        unreadCount: 0,
      })
    }

    return Response.json(result)
  } catch (e: any) {
    console.error('Chat GET error:', e?.message, e?.stack?.split('\n').slice(0, 3).join('\n'))
    return Response.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { facultyId, studentId } = body
    if (!facultyId || !studentId) {
      return Response.json({ error: 'facultyId and studentId are required' }, { status: 400 })
    }

    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const conversation = await prisma.conversation.upsert({
      where: { parentId_facultyId_studentId: { parentId: parent.id, facultyId, studentId } },
      create: { parentId: parent.id, facultyId, studentId },
      update: {},
    })

    return Response.json(conversation, { status: 201 })
  } catch (e: any) {
    console.error('Chat POST error:', e?.message)
    return Response.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
