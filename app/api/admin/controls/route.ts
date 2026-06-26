import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
    if (!parent) return Response.json({ error: 'Not a parent' }, { status: 403 })

    const control = await prisma.parentControl.findUnique({ where: { parentId: parent.id } })
    return Response.json(control)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id }, include: { students: true } })
    if (!parent || parent.students.length === 0) return Response.json({ error: 'No student linked' }, { status: 404 })

    const body = await req.json()
    const control = await prisma.parentControl.upsert({
      where: { parentId: parent.id },
      create: { parentId: parent.id, studentId: parent.students[0].id, ...body },
      update: body,
    })
    return Response.json(control)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
