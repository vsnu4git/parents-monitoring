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
    const account = await prisma.campusOneAccount.findUnique({
      where: { studentId: id },
      include: {
        transactions: { orderBy: { transactionAt: 'desc' }, take: 100 },
      },
    })
    return Response.json(account)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
