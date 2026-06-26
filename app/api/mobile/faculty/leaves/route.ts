import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const leaveUpdateSchema = z.object({
  leaveId: z.string(),
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
})

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const isAdmin = auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN'
    const faculty = await prisma.faculty.findUnique({ where: { userId: auth.userId } })

    if (!faculty && !isAdmin) {
      return Response.json({ error: 'Faculty not found' }, { status: 404 })
    }

    // Get pending leave requests — faculty sees their department, admin sees all
    const leaves = await prisma.leaveRecord.findMany({
      where: {
        status: 'PENDING',
        student: {
          status: 'ACTIVE',
          ...(faculty ? { department: { code: faculty.department } } : {}),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            registerNumber: true,
            semester: true,
            section: true,
            department: { select: { code: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({
      leaves: leaves.map((l) => ({
        id: l.id,
        type: l.type,
        startDate: l.startDate,
        endDate: l.endDate,
        reason: l.reason,
        status: l.status,
        remarks: l.remarks,
        createdAt: l.createdAt,
        student: l.student,
      })),
    })
  } catch (error) {
    console.error('Get leaves error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = leaveUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { leaveId, status, remarks } = parsed.data

    const isAdmin2 = auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN'
    const faculty2 = await prisma.faculty.findUnique({ where: { userId: auth.userId } })

    if (!faculty2 && !isAdmin2) {
      return Response.json({ error: 'Faculty not found' }, { status: 404 })
    }

    const leave = await prisma.leaveRecord.findUnique({
      where: { id: leaveId },
      include: { student: { include: { department: true } } },
    })

    if (!leave) {
      return Response.json({ error: 'Leave record not found' }, { status: 404 })
    }

    // Faculty can only approve leaves in their department, admin can approve any
    if (!isAdmin2 && faculty2 && leave.student.department.code !== faculty2.department) {
      return Response.json(
        { error: 'This leave request is not in your department' },
        { status: 403 }
      )
    }

    if (leave.status !== 'PENDING') {
      return Response.json(
        { error: 'Leave request has already been processed' },
        { status: 400 }
      )
    }

    const updated = await prisma.leaveRecord.update({
      where: { id: leaveId },
      data: {
        status,
        remarks: remarks || null,
      },
      include: {
        student: {
          select: { id: true, name: true, registerNumber: true },
        },
      },
    })

    return Response.json({
      leave: {
        id: updated.id,
        status: updated.status,
        remarks: updated.remarks,
        student: updated.student,
      },
    })
  } catch (error) {
    console.error('Update leave error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
