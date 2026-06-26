import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const createTicketSchema = z.object({
  parentId: z.string(),
  studentId: z.string(),
  category: z.enum(['ATTENDANCE', 'MARKS', 'FEE', 'LEAVE', 'GENERAL', 'EMERGENCY', 'COMPLAINT', 'OTHER']),
  subject: z.string().min(5),
  description: z.string().min(20),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = createTicketSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    // Verify parent belongs to this user
    const parent = await prisma.parent.findUnique({ where: { id: parsed.data.parentId, userId: session.user.id } })
    if (!parent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const ticket = await prisma.ticket.create({
      data: {
        parentId: parsed.data.parentId,
        studentId: parsed.data.studentId,
        category: parsed.data.category,
        subject: parsed.data.subject,
        description: parsed.data.description,
        priority: parsed.data.priority,
      }
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
