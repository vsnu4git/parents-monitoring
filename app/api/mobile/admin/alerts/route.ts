import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const createAlertSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(1),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  targetScope: z.enum(['INSTITUTION', 'DEPARTMENT', 'INDIVIDUAL']).optional(),
  targetDept: z.string().optional(),
  expiresAt: z.string().optional(),
})

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = createAlertSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const alert = await prisma.emergencyAlert.create({
      data: {
        title: data.title,
        message: data.message,
        severity: data.severity || 'WARNING',
        targetScope: data.targetScope || 'INSTITUTION',
        targetDept: data.targetDept || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })

    return Response.json(alert, { status: 201 })
  } catch (error) {
    console.error('Create alert error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
