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
    const body = await req.json().catch(() => ({}))
    const alertId = body?.alertId

    if (alertId) {
      // Mark a single alert as read
      await prisma.locationAlert.update({
        where: { id: alertId },
        data: { isRead: true },
      })
    } else {
      // Mark all unread alerts for this student as read
      await prisma.locationAlert.updateMany({
        where: { studentId: id, isRead: false },
        data: { isRead: true },
      })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
