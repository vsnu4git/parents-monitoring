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
    const logs = await prisma.foodLog.findMany({
      where: { studentId: id },
      orderBy: { loggedAt: 'desc' },
      take: 50,
    })
    return Response.json(logs)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
