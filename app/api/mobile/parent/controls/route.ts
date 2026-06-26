import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getParentControls, updateParentControls } from '@/lib/data/mobile.data'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const controls = await getParentControls(parent.id)
    return Response.json(controls || {
      spendingLimitDaily: null,
      spendingLimitWeekly: null,
      attendanceTarget: null,
      curfewTime: null,
      geofenceAlerts: true,
      mealAlerts: true,
      spendingAlerts: true,
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: auth.userId },
      include: { students: { where: { status: 'ACTIVE' }, take: 1 } },
    })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })
    if (parent.students.length === 0) return Response.json({ error: 'No active students' }, { status: 400 })

    const body = await req.json()
    const controls = await updateParentControls(parent.id, {
      studentId: parent.students[0].id,
      ...body,
    })
    return Response.json(controls)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
