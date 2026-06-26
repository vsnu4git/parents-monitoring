import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const facultySubjectSchema = z.object({
  facultyId: z.string(),
  subjectId: z.string(),
})

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = facultySubjectSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const { facultyId, subjectId } = parsed.data

    // Verify faculty and subject exist
    const [faculty, subject] = await Promise.all([
      prisma.faculty.findUnique({ where: { id: facultyId } }),
      prisma.subject.findUnique({ where: { id: subjectId } }),
    ])

    if (!faculty) return Response.json({ error: 'Faculty not found' }, { status: 404 })
    if (!subject) return Response.json({ error: 'Subject not found' }, { status: 404 })

    // Check if already assigned
    const existing = await prisma.facultySubject.findUnique({
      where: { facultyId_subjectId: { facultyId, subjectId } },
    })
    if (existing) {
      return Response.json({ error: 'Faculty already assigned to this subject' }, { status: 409 })
    }

    const assignment = await prisma.facultySubject.create({
      data: { facultyId, subjectId },
      include: {
        faculty: { include: { user: { select: { id: true, name: true, email: true } } } },
        subject: { include: { department: true } },
      },
    })

    return Response.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Assign faculty-subject error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = facultySubjectSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const { facultyId, subjectId } = parsed.data

    const existing = await prisma.facultySubject.findUnique({
      where: { facultyId_subjectId: { facultyId, subjectId } },
    })
    if (!existing) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 })
    }

    await prisma.facultySubject.delete({
      where: { facultyId_subjectId: { facultyId, subjectId } },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Unassign faculty-subject error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
