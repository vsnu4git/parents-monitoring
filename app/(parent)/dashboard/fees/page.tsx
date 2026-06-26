import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import { FeeStatus } from '@prisma/client'
import { format } from 'date-fns'
import { CheckCircle } from 'lucide-react'
import { FeePieChart } from './fee-pie-chart'

const feeStatusConfig: Record<FeeStatus, { label: string; color: string; bg: string }> = {
  PAID: { label: 'Paid', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/15' },
  PENDING: { label: 'Pending', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/15' },
  PARTIAL: { label: 'Partial', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/15' },
  OVERDUE: { label: 'Overdue', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/15' },
  WAIVED: { label: 'Waived', color: 'text-[var(--pms-text-muted)]', bg: 'bg-[#A1A1AA]/15' },
}


export default async function FeesPage() {
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
    const fees = await prisma.feeRecord.findMany({
      where: { studentId: student.id },
      include: { acknowledgements: { where: { parentId: parent.id } } },
      orderBy: { dueDate: 'desc' }
    })

    const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0)
    const totalDue = fees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0)
    const overdueFees = fees.filter(f => f.status === FeeStatus.OVERDUE)
    const pendingAmount = fees.filter(f => f.status === FeeStatus.PENDING || f.status === FeeStatus.PARTIAL).reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0)
    const overdueAmount = overdueFees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0)

    return (
      <div className="px-5 pt-5 pb-28 space-y-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Fee Status</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>{student.name} &bull; {student.registerNumber}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--pms-text-muted)' }}>Paid</p>
            <p className="text-base font-bold text-[#22C55E]">₹{totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--pms-text-muted)' }}>Due</p>
            <p className={`text-base font-bold ${totalDue > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
              {totalDue > 0 ? `₹${totalDue.toLocaleString('en-IN')}` : 'Clear'}
            </p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--pms-text-muted)' }}>Overdue</p>
            <p className={`text-base font-bold ${overdueFees.length > 0 ? 'text-[#EF4444]' : 'text-[var(--pms-text-muted)]'}`}>
              {overdueFees.length}
            </p>
          </div>
        </div>

        {/* Pie Chart */}
        <FeePieChart paid={totalPaid} pending={pendingAmount} overdue={overdueAmount} />

        {/* Fee Records */}
        <div className="space-y-3">
          {fees.map(fee => {
            const config = feeStatusConfig[fee.status]
            const dueAmount = fee.totalAmount - fee.paidAmount
            const isAcknowledged = fee.acknowledgements.length > 0

            return (
              <div key={fee.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: `1px solid ${fee.status === FeeStatus.OVERDUE ? '#EF444440' : 'var(--pms-border)'}` }}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-base" style={{ color: 'var(--pms-text)' }}>{fee.term}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                </div>

                {fee.description && <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>{fee.description}</p>}

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase" style={{ color: 'var(--pms-text-muted)' }}>Total</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--pms-text)' }}>₹{fee.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="w-px h-8" style={{ backgroundColor: 'var(--pms-border)' }} />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase" style={{ color: 'var(--pms-text-muted)' }}>Paid</p>
                    <p className="text-sm font-bold text-[#22C55E]">₹{fee.paidAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="w-px h-8" style={{ backgroundColor: 'var(--pms-border)' }} />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase" style={{ color: 'var(--pms-text-muted)' }}>Due</p>
                    <p className={`text-sm font-bold ${dueAmount > 0 ? 'text-[#EF4444]' : ''}`} style={{ color: dueAmount > 0 ? undefined : 'var(--pms-text-muted)' }}>
                      {dueAmount > 0 ? `₹${dueAmount.toLocaleString('en-IN')}` : '—'}
                    </p>
                  </div>
                </div>

                <p className="text-xs mt-3" style={{ color: 'var(--pms-text-muted)' }}>
                  Due: {format(new Date(fee.dueDate), 'MMMM d, yyyy')}
                  {fee.paidAt && <span className="text-[#22C55E] ml-2">• Paid {format(new Date(fee.paidAt), 'MMM d, yyyy')}</span>}
                </p>

                {(fee.status === FeeStatus.PENDING || fee.status === FeeStatus.PARTIAL || fee.status === FeeStatus.OVERDUE) && !isAcknowledged && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--pms-border)' }}>
                    <AcknowledgeFeeButton feeRecordId={fee.id} parentId={parent.id} />
                  </div>
                )}

                {isAcknowledged && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--pms-border)' }}>
                    <p className="text-xs text-[#22C55E] flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Acknowledged on {format(new Date(fee.acknowledgements[0].acknowledgedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch (error) {
    return <div className="p-8 text-center text-[var(--pms-text-muted)]">Error loading fees. Please check database connection.</div>
  }
}

function AcknowledgeFeeButton({ feeRecordId, parentId }: { feeRecordId: string; parentId: string }) {
  return (
    <form action={async () => {
      'use server'
      const { prisma } = await import('@/lib/prisma')
      try {
        await prisma.feeAcknowledgement.create({ data: { feeRecordId, parentId } })
      } catch {}
    }}>
      <button
        type="submit"
        className="w-full py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all duration-150"
        style={{ backgroundColor: 'var(--pms-brown)', color: 'var(--pms-bg)' }}
      >
        Acknowledge Receipt
      </button>
    </form>
  )
}
