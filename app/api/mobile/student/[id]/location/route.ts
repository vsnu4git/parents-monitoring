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
    const [checkIns, zones, alerts] = await Promise.all([
      prisma.studentCheckIn.findMany({
        where: { studentId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.geofenceZone.findMany({ where: { isActive: true } }),
      prisma.locationAlert.findMany({
        where: { studentId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    return Response.json({ checkIns, zones, alerts })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
