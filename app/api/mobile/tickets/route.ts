import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const createTicketSchema = z.object({
  studentId: z.string(),
  category: z.enum(['ATTENDANCE', 'MARKS', 'FEE', 'LEAVE', 'GENERAL', 'EMERGENCY', 'COMPLAINT', 'OTHER']),
  subject: z.string().min(5),
  description: z.string().min(20),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
})

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createTicketSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: auth.userId },
      include: { students: { where: { id: parsed.data.studentId } } },
    })
    if (!parent) return Response.json({ error: 'Parent not found' }, { status: 404 })
    if (parent.students.length === 0) return Response.json({ error: 'Student not found' }, { status: 403 })

    const ticket = await prisma.ticket.create({
      data: {
        parentId: parent.id,
        studentId: parsed.data.studentId,
        category: parsed.data.category,
        subject: parsed.data.subject,
        description: parsed.data.description,
        priority: parsed.data.priority,
      },
    })

    return Response.json(ticket, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
