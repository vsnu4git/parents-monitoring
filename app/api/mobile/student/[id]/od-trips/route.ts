import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const trips = await prisma.oDTrip.findMany({
      where: { studentId: id },
      include: { leaveRecord: true },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(trips)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
