import { getStudentSession } from '@/lib/student-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { FeeStatus } from '@prisma/client'
import { CreditCard, Clock, CheckCircle, AlertTriangle, CircleDollarSign } from 'lucide-react'
import { format } from 'date-fns'

export default async function FeesPage() {
  const session = await getStudentSession()
  if (!session) redirect('/login')

  const feeRecords = await prisma.feeRecord.findMany({
    where: { studentId: session.studentId },
    orderBy: { dueDate: 'desc' },
  })

  const totalAmount = feeRecords.reduce((sum, f) => sum + f.totalAmount, 0)
  const paidAmount = feeRecords.reduce((sum, f) => sum + f.paidAmount, 0)
  const dueAmount = totalAmount - paidAmount

  function getStatusStyle(status: FeeStatus) {
    switch (status) {
      case FeeStatus.PAID:
        return { bg: 'rgba(34,197,94,0.1)', color: '#22C55E', label: 'Paid' }
      case FeeStatus.PENDING:
        return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', label: 'Pending' }
      case FeeStatus.OVERDUE:
        return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'Overdue' }
      case FeeStatus.PARTIAL:
        return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', label: 'Partial' }
      case FeeStatus.WAIVED:
        return { bg: 'rgba(34,197,94,0.1)', color: '#22C55E', label: 'Waived' }
      default:
        return { bg: 'var(--pms-glow)', color: 'var(--pms-text-muted)', label: status }
    }
  }

  return (
    <div className="px-5 pt-5 pb-28 space-y-4" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
          Finances
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>
          Fee Records
        </h1>
      </div>

      {/* Summary Card */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: 'var(--pms-card)',
          border: '1px solid var(--pms-border)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--pms-text)' }}
          >
            <CircleDollarSign className="w-7 h-7" style={{ color: 'var(--pms-bg)' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
              Fee Summary
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold" style={{ color: dueAmount > 0 ? '#F59E0B' : '#22C55E' }}>
                {dueAmount > 0 ? `₹${dueAmount.toLocaleString('en-IN')}` : 'All Paid'}
              </p>
              {dueAmount > 0 && (
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>due</p>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>
              ₹{paidAmount.toLocaleString('en-IN')} paid of ₹{totalAmount.toLocaleString('en-IN')} total
            </p>
          </div>
        </div>
      </div>

      {/* Fee Records */}
      {feeRecords.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--pms-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--pms-text-muted)' }}>No fee records found.</p>
        </div>
      ) : (
        feeRecords.map((fee) => {
          const status = getStatusStyle(fee.status)
          const remaining = fee.totalAmount - fee.paidAmount
          return (
            <div
              key={fee.id}
              className="rounded-2xl p-4"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--pms-glow)' }}
                  >
                    <CreditCard className="w-4 h-4" style={{ color: 'var(--pms-text)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--pms-text)' }}>{fee.term}</p>
                    {fee.description && (
                      <p className="text-[10px] truncate" style={{ color: 'var(--pms-text-muted)' }}>{fee.description}</p>
                    )}
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Total</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--pms-text)' }}>
                    ₹{fee.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Paid</p>
                  <p className="text-sm font-bold" style={{ color: '#22C55E' }}>
                    ₹{fee.paidAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Remaining</p>
                  <p className="text-sm font-bold" style={{ color: remaining > 0 ? '#F59E0B' : '#22C55E' }}>
                    ₹{remaining.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-3 pt-3" style={{ borderTop: '1px solid var(--pms-border)' }}>
                <Clock className="w-3 h-3" style={{ color: 'var(--pms-text-muted)' }} />
                <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>
                  Due: {format(new Date(fee.dueDate), 'MMM d, yyyy')}
                </p>
                {fee.paidAt && (
                  <>
                    <span className="mx-1" style={{ color: 'var(--pms-text-muted)' }}>·</span>
                    <CheckCircle className="w-3 h-3" style={{ color: '#22C55E' }} />
                    <p className="text-[10px]" style={{ color: '#22C55E' }}>
                      Paid: {format(new Date(fee.paidAt), 'MMM d, yyyy')}
                    </p>
                  </>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
