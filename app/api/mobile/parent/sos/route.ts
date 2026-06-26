import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getSOSAlerts, triggerSOS, updateSOSAlertStatus } from '@/lib/data/mobile.data'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const alerts = await getSOSAlerts(parent.id)
    return Response.json(alerts)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const body = await req.json()
    if (!body.studentId) return Response.json({ error: 'studentId is required' }, { status: 400 })

    const alert = await triggerSOS(parent.id, body)
    return Response.json(alert)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const body = await req.json()
    if (!body.alertId || !body.status) {
      return Response.json({ error: 'alertId and status are required' }, { status: 400 })
    }

    const validStatuses = ['ACKNOWLEDGED', 'RESOLVED', 'FALSE_ALARM']
    if (!validStatuses.includes(body.status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await updateSOSAlertStatus(parent.id, body.alertId, body.status)
    return Response.json(updated)
  } catch (err: any) {
    if (err?.message === 'Alert not found') {
      return Response.json({ error: 'Alert not found' }, { status: 404 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
