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
    const parent = await prisma.parent.findUnique({
      where: { userId: auth.userId },
      include: { students: true },
    })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })

    const studentIds = parent.students.map((s) => s.id)
    const fee = await prisma.feeRecord.findFirst({
      where: { id, studentId: { in: studentIds } },
    })
    if (!fee) return Response.json({ error: 'Fee record not found' }, { status: 404 })

    const existing = await prisma.feeAcknowledgement.findFirst({
      where: { feeRecordId: id, parentId: parent.id },
    })
    if (existing) return Response.json({ message: 'Already acknowledged' })

    const ack = await prisma.feeAcknowledgement.create({
      data: { feeRecordId: id, parentId: parent.id },
    })
    return Response.json(ack)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
