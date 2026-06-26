import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const checkInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  label: z.string().optional(),
  type: z.enum(['CAMPUS_ENTRY', 'CAMPUS_EXIT', 'MANUAL', 'AUTO']),
})

// Haversine distance in meters between two lat/lng points
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = checkInSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid data' }, { status: 400 })

    const { latitude, longitude } = parsed.data

    // ── Geofence detection ──
    // Get all active zones and the previous check-in
    const [zones, prevCheckIn] = await Promise.all([
      prisma.geofenceZone.findMany({ where: { isActive: true } }),
      prisma.studentCheckIn.findFirst({
        where: { studentId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Find the main campus zone (largest radius)
    const mainZone = zones.reduce((a, b) => (a.radiusM > b.radiusM ? a : b), zones[0])

    // Check if student is inside the main campus zone now
    const distToMain = mainZone
      ? haversineMeters(latitude, longitude, mainZone.latitude, mainZone.longitude)
      : Infinity
    const isInsideCampus = mainZone ? distToMain <= mainZone.radiusM : false

    // Check if student was inside campus at previous check-in
    let wasInsideCampus = false
    if (prevCheckIn && mainZone) {
      const prevDist = haversineMeters(
        prevCheckIn.latitude, prevCheckIn.longitude,
        mainZone.latitude, mainZone.longitude
      )
      wasInsideCampus = prevDist <= mainZone.radiusM
    }

    // Auto-determine the check-in type based on geofence crossing
    let resolvedType = parsed.data.type
    let resolvedLabel = parsed.data.label

    if (wasInsideCampus && !isInsideCampus) {
      // Student just LEFT campus
      resolvedType = 'CAMPUS_EXIT'
      resolvedLabel = resolvedLabel || 'Left Campus'

      // Create a location alert
      await prisma.locationAlert.create({
        data: {
          studentId: id,
          type: 'LEFT_CAMPUS',
          message: `Student left the campus area (${Math.round(distToMain)}m from center)`,
          latitude,
          longitude,
        },
      })
    } else if (!wasInsideCampus && isInsideCampus) {
      // Student just ENTERED campus
      resolvedType = 'CAMPUS_ENTRY'
      resolvedLabel = resolvedLabel || 'Entered Campus'

      await prisma.locationAlert.create({
        data: {
          studentId: id,
          type: 'ARRIVED_CAMPUS',
          message: `Student arrived at campus`,
          latitude,
          longitude,
        },
      })
    } else {
      // No boundary crossing — check which sub-zone they're closest to
      if (isInsideCampus) {
        let closestZone = mainZone
        let closestDist = distToMain
        for (const zone of zones) {
          const d = haversineMeters(latitude, longitude, zone.latitude, zone.longitude)
          if (d <= zone.radiusM && d < closestDist) {
            closestDist = d
            closestZone = zone
          }
        }
        resolvedLabel = resolvedLabel || closestZone?.name || 'Campus'
      }
    }

    // Save the check-in
    const checkIn = await prisma.studentCheckIn.create({
      data: {
        studentId: id,
        latitude,
        longitude,
        label: resolvedLabel,
        type: resolvedType,
      },
    })

    // ── Speed anomaly detection ──
    if (prevCheckIn) {
      const timeDiffMs = new Date().getTime() - new Date(prevCheckIn.createdAt).getTime()
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60)
      if (timeDiffHours > 0) {
        const distMoved = haversineMeters(
          prevCheckIn.latitude, prevCheckIn.longitude,
          latitude, longitude
        )
        const speedKmh = (distMoved / 1000) / timeDiffHours
        // Flag impossible speed (> 200 km/h suggests GPS spoofing or error)
        if (speedKmh > 200 && distMoved > 100) {
          await prisma.locationAlert.create({
            data: {
              studentId: id,
              type: 'UNUSUAL_LOCATION',
              message: `Unusual movement detected: ${Math.round(distMoved)}m in ${Math.round(timeDiffMs / 1000)}s (${Math.round(speedKmh)} km/h)`,
              latitude,
              longitude,
            },
          })
        }
      }
    }

    // ── OD trip tracking ──
    // Check active trips (IN_TRANSIT or PENDING)
    const activeTrip = await prisma.oDTrip.findFirst({
      where: { studentId: id, status: { in: ['IN_TRANSIT', 'PENDING'] } },
    })
    if (activeTrip) {
      const distToDest = haversineMeters(
        latitude, longitude,
        activeTrip.destinationLat, activeTrip.destinationLng
      )
      await prisma.oDTrip.update({
        where: { id: activeTrip.id },
        data: {
          lastLat: latitude,
          lastLng: longitude,
          lastLocationAt: new Date(),
          // Auto-mark as ARRIVED if within destination geofence
          ...(distToDest <= activeTrip.radiusM && activeTrip.status === 'IN_TRANSIT'
            ? { status: 'ARRIVED', arrivedAt: new Date() }
            : {}),
        },
      })
    }

    // Check ARRIVED trips — auto-mark RETURNED when student re-enters campus
    if (isInsideCampus) {
      const arrivedTrip = await prisma.oDTrip.findFirst({
        where: { studentId: id, status: 'ARRIVED' },
      })
      if (arrivedTrip) {
        await prisma.oDTrip.update({
          where: { id: arrivedTrip.id },
          data: {
            status: 'RETURNED',
            returnedAt: new Date(),
            lastLat: latitude,
            lastLng: longitude,
            lastLocationAt: new Date(),
          },
        })
      }
    }

    // ── Curfew violation check ──
    if (!isInsideCampus) {
      const parentControl = await prisma.parentControl.findUnique({
        where: { studentId: id },
      })
      const curfew = parentControl?.curfewTime
      if (curfew && parentControl?.geofenceAlerts) {
        const now = new Date()
        const [curfewH, curfewM] = curfew.split(':').map(Number)
        const curfewDate = new Date(now)
        curfewDate.setHours(curfewH, curfewM, 0, 0)
        if (now >= curfewDate) {
          // Check if we already sent a curfew alert today
          const todayStart = new Date(now)
          todayStart.setHours(0, 0, 0, 0)
          const existingCurfewAlert = await prisma.locationAlert.findFirst({
            where: {
              studentId: id,
              type: 'LEFT_CAMPUS',
              message: { contains: 'curfew' },
              createdAt: { gte: todayStart },
            },
          })
          if (!existingCurfewAlert) {
            await prisma.locationAlert.create({
              data: {
                studentId: id,
                type: 'LEFT_CAMPUS',
                message: `Student is off campus past curfew time (${curfew})`,
                latitude,
                longitude,
              },
            })
          }
        }
      }
    }

    return Response.json({
      ...checkIn,
      isInsideCampus,
      distanceFromCampus: Math.round(distToMain),
      detectedZone: resolvedLabel,
    }, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
