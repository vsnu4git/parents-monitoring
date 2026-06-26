import { prisma } from '@/lib/prisma'
import { FeeStatus } from '@prisma/client'
import { format } from 'date-fns'

export default async function AdminFeesPage() {
  try {
    const fees = await prisma.feeRecord.findMany({
      include: { student: { include: { department: true } } },
      orderBy: { dueDate: 'desc' },
    })

    const paid = fees.filter(f => f.status === FeeStatus.PAID)
    const pending = fees.filter(f => f.status === FeeStatus.PENDING || f.status === FeeStatus.PARTIAL)
    const overdue = fees.filter(f => f.status === FeeStatus.OVERDUE)
    const totalCollected = paid.reduce((s, f) => s + f.paidAmount, 0)
    const totalDue = [...pending, ...overdue].reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0)

    const stats = [
      { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, color: '#4ADE80' },
      { label: 'Amount Due', value: `₹${totalDue.toLocaleString('en-IN')}`, color: '#EF4444' },
      { label: 'Overdue', value: overdue.length, color: '#EF4444' },
      { label: 'Pending', value: pending.length, color: '#FB923C' },
    ]

    const statusColor: Record<string, string> = {
      PAID: '#4ADE80', PENDING: '#FB923C', PARTIAL: '#A1A1AA', OVERDUE: '#EF4444', WAIVED: '#71717A',
    }

    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#FAFAFA' }}>Fee Management</h1>
        <p className="text-sm mb-6" style={{ color: '#52525B' }}>{fees.length} records</p>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl p-5" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#71717A' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
          {fees.map((f, i) => (
            <div
              key={f.id}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: i < fees.length - 1 ? '1px solid #27272A' : 'none' }}
            >
              <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor[f.status] || '#71717A' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#FAFAFA' }}>{f.student.name}</p>
                <p className="text-xs" style={{ color: '#71717A' }}>
                  {f.student.department.code} &middot; {f.term} &middot; {f.description}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: statusColor[f.status] }}>
                  ₹{f.totalAmount.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px]" style={{ color: '#52525B' }}>
                  Due {format(new Date(f.dueDate), 'MMM d, yyyy')}
                </p>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: `${statusColor[f.status]}15`, color: statusColor[f.status] }}
              >
                {f.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#FAFAFA' }}>Fee Management</h1>
        <p className="mt-4" style={{ color: '#71717A' }}>Error loading fees.</p>
      </div>
    )
  }
}
