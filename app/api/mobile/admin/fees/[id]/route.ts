import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const updateFeeSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'WAIVED']).optional(),
  paidAmount: z.number().min(0).optional(),
  paidAt: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateFeeSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.feeRecord.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Fee record not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status
    if (parsed.data.paidAmount !== undefined) updateData.paidAmount = parsed.data.paidAmount
    if (parsed.data.paidAt !== undefined) updateData.paidAt = new Date(parsed.data.paidAt)

    const fee = await prisma.feeRecord.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true, registerNumber: true },
        },
      },
    })

    return Response.json(fee)
  } catch (error) {
    console.error('Update fee error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
