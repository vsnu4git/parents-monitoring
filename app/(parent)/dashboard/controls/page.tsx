import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import { ControlsClient } from './controls-client'

export default async function ControlsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: true },
    })
    if (!parent || parent.students.length === 0) return <div className="p-8 text-[var(--pms-text-muted)]" style={{ backgroundColor: 'var(--pms-bg)' }}>No student linked.</div>

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)
    const control = await prisma.parentControl.findUnique({ where: { parentId: parent.id } })
    const data = JSON.parse(JSON.stringify({ control, studentName: student.name }))
    return <ControlsClient data={data} />
  } catch {
    return <div className="p-8 text-[var(--pms-text-muted)]" style={{ backgroundColor: 'var(--pms-bg)' }}>Error loading controls.</div>
  }
}
