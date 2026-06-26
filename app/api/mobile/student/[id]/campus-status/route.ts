import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

// Haversine distance in meters
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const [lastCheckIn, zones] = await Promise.all([
      prisma.studentCheckIn.findFirst({
        where: { studentId: id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.geofenceZone.findMany({ where: { isActive: true } }),
    ])

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [todayCheckIns, unreadAlerts] = await Promise.all([
      prisma.studentCheckIn.findMany({
        where: { studentId: id, createdAt: { gte: todayStart } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.locationAlert.count({
        where: { studentId: id, isRead: false },
      }),
    ])

    // Verify actual geofence position instead of relying on check-in type
    let isOnCampus = false
    let distanceFromCampus: number | null = null
    let currentZone: string | null = null

    if (lastCheckIn && zones.length > 0) {
      const mainZone = zones.reduce((a, b) => (a.radiusM > b.radiusM ? a : b), zones[0])
      const dist = haversineMeters(
        lastCheckIn.latitude, lastCheckIn.longitude,
        mainZone.latitude, mainZone.longitude
      )
      isOnCampus = dist <= mainZone.radiusM
      distanceFromCampus = Math.round(dist)

      // Find the closest sub-zone
      if (isOnCampus) {
        let closestDist = dist
        currentZone = mainZone.name
        for (const zone of zones) {
          const d = haversineMeters(lastCheckIn.latitude, lastCheckIn.longitude, zone.latitude, zone.longitude)
          if (d <= zone.radiusM && d < closestDist) {
            closestDist = d
            currentZone = zone.name
          }
        }
      }
    }

    // Check curfew violation
    let curfewViolation = false
    if (!isOnCampus && lastCheckIn) {
      const parentControl = await prisma.parentControl.findUnique({
        where: { studentId: id },
      })
      const curfew = parentControl?.curfewTime
      if (curfew) {
        const now = new Date()
        const [curfewH, curfewM] = curfew.split(':').map(Number)
        const curfewDate = new Date(now)
        curfewDate.setHours(curfewH, curfewM, 0, 0)
        if (now >= curfewDate) {
          curfewViolation = true
        }
      }
    }

    return Response.json({
      isOnCampus,
      lastCheckIn,
      todayCheckIns,
      lastSeen: lastCheckIn?.createdAt || null,
      distanceFromCampus,
      currentZone,
      unreadAlerts,
      curfewViolation,
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
