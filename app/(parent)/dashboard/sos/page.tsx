import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import { SOSClient } from './sos-client'

export default async function SOSPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: { include: { department: true } } },
    })
    if (!parent || parent.students.length === 0) return <div className="p-8 text-[var(--pms-text-muted)]" style={{ backgroundColor: 'var(--pms-bg)' }}>No student linked.</div>

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)
    const sosAlerts = await prisma.sOSAlert.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const activeAlert = sosAlerts.find(a => a.status === 'ACTIVE')

    const data = JSON.parse(JSON.stringify({ student, sosAlerts, activeAlert, parentId: parent.id }))
    return <SOSClient data={data} />
  } catch {
    return <div className="p-8 text-[var(--pms-text-muted)]" style={{ backgroundColor: 'var(--pms-bg)' }}>Error loading SOS data.</div>
  }
}
