import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'

const leaveTypeColors: Record<string, string> = {
  MEDICAL: 'bg-[#EF4444]/15 text-[#EF4444]',
  PERSONAL: 'bg-[#A1A1AA]/15 text-[var(--pms-text)]',
  FAMILY: 'bg-[#A1A1AA]/15 text-[var(--pms-brown)]',
  EVENT: 'bg-[#22C55E]/15 text-[#22C55E]',
  OD: 'bg-[#A1A1AA]/15 text-[var(--pms-text-sec)]',
  OTHER: 'bg-[#A1A1AA]/15 text-[var(--pms-text-sec)]',
}

const statusColors: Record<string, string> = {
  APPROVED: 'bg-[#22C55E]/15 text-[#22C55E]',
  PENDING: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  REJECTED: 'bg-[#EF4444]/15 text-[#EF4444]',
}

export default async function LeavePage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: true }
    })
    if (!parent || parent.students.length === 0) return <div className="p-8 text-center text-[var(--pms-text-muted)]">No student linked.</div>

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)
    const leaves = await prisma.leaveRecord.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' }
    })

    const approved = leaves.filter(l => l.status === 'APPROVED').length
    const pending = leaves.filter(l => l.status === 'PENDING').length
    const totalDays = leaves.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + differenceInDays(new Date(l.endDate), new Date(l.startDate)) + 1, 0)

    return (
      <div className="px-5 pt-5 pb-28 space-y-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Leave &amp; OD</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>{student.name} &bull; {student.registerNumber}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--pms-text-muted)' }}>Approved</p>
            <p className="text-base font-bold text-[#22C55E]">{approved}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--pms-text-muted)' }}>Pending</p>
            <p className="text-base font-bold text-[#F59E0B]">{pending}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--pms-text-muted)' }}>Days Taken</p>
            <p className="text-base font-bold" style={{ color: 'var(--pms-brown)' }}>{totalDays}</p>
          </div>
        </div>

        {/* Leave Records */}
        {leaves.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p style={{ color: 'var(--pms-text-muted)' }}>No leave records found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(l => {
              const days = differenceInDays(new Date(l.endDate), new Date(l.startDate)) + 1
              return (
                <div key={l.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${leaveTypeColors[l.type] || 'bg-[#A1A1AA]/15 text-[var(--pms-text-sec)]'}`}>
                      {l.type}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[l.status] || 'bg-[#A1A1AA]/15 text-[var(--pms-text-sec)]'}`}>
                      {l.status}
                    </span>
                  </div>

                  <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>
                    {format(new Date(l.startDate), 'MMM d')} – {format(new Date(l.endDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>{days} day{days > 1 ? 's' : ''}</p>

                  <p className="text-sm mt-2" style={{ color: 'var(--pms-text-sec)' }}>{l.reason}</p>

                  {l.remarks && (
                    <p className="text-xs mt-2 italic" style={{ color: 'var(--pms-text-muted)' }}>&ldquo;{l.remarks}&rdquo;</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  } catch (error) {
    return <div className="p-8 text-center text-[var(--pms-text-muted)]">Error loading leave records.</div>
  }
}
