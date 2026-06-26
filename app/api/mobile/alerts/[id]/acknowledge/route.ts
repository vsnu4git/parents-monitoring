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
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const alert = await prisma.emergencyAlert.findUnique({ where: { id } })
    if (!alert) return Response.json({ error: 'Alert not found' }, { status: 404 })

    const existing = await prisma.alertAcknowledgement.findFirst({
      where: { alertId: id, parentId: parent.id },
    })
    if (existing) return Response.json({ message: 'Already acknowledged' })

    const ack = await prisma.alertAcknowledgement.create({
      data: { alertId: id, parentId: parent.id },
    })
    return Response.json(ack)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
