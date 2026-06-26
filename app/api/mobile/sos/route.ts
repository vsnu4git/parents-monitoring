import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const sosSchema = z.object({
  studentId: z.string(),
  parentId: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  message: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = sosSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid data' }, { status: 400 })

    const alert = await prisma.sOSAlert.create({ data: parsed.data })
    return Response.json(alert, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
