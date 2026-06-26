import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const schema = z.object({
  title: z.string().min(5),
  message: z.string().min(20),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  targetScope: z.enum(['INSTITUTION', 'DEPARTMENT', 'INDIVIDUAL']),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const alert = await prisma.emergencyAlert.create({ data: { ...parsed.data, isActive: true } })

    // Create notifications for all parents
    const parents = await prisma.parent.findMany({ include: { students: true } })
    await prisma.notification.createMany({
      data: parents.flatMap(p => p.students.map(s => ({
        targetRole: 'PARENT' as const,
        studentId: s.id,
        type: 'EMERGENCY' as const,
        title: parsed.data.title,
        message: parsed.data.message,
        priority: parsed.data.severity === 'CRITICAL' ? 'CRITICAL' as const : 'HIGH' as const,
      })))
    })

    return NextResponse.json(alert)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
