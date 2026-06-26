import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const createNoticeSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(1),
  category: z.string(),
  requiresAcknowledgement: z.boolean().optional(),
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
    const parsed = createNoticeSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const notice = await prisma.notice.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        requiresAcknowledgement: data.requiresAcknowledgement ?? false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })

    return Response.json(notice, { status: 201 })
  } catch (error) {
    console.error('Create notice error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
