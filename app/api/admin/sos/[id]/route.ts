import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const { status } = await req.json()
    const alert = await prisma.sOSAlert.update({
      where: { id },
      data: { status, resolvedAt: ['RESOLVED', 'FALSE_ALARM'].includes(status) ? new Date() : undefined },
    })
    return Response.json(alert)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
