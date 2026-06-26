import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  department: z.string().optional(),
  isPublic: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const events = await prisma.calendarEvent.findMany({
    orderBy: { startDate: 'asc' },
  })
  return Response.json(events)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid data', details: parsed.error.issues }, { status: 400 })
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      department: parsed.data.department || null,
      isPublic: parsed.data.isPublic ?? true,
    },
  })

  return Response.json(event, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return Response.json({ error: 'Event ID required' }, { status: 400 })

  const parsed = eventSchema.safeParse(rest)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid data' }, { status: 400 })
  }

  const event = await prisma.calendarEvent.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      department: parsed.data.department || null,
      isPublic: parsed.data.isPublic ?? true,
    },
  })

  return Response.json(event)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'Event ID required' }, { status: 400 })

  await prisma.calendarEvent.delete({ where: { id } })
  return Response.json({ ok: true })
}
