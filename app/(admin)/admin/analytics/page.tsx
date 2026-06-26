import { prisma } from '@/lib/prisma'
import { FeeStatus, TicketStatus } from '@prisma/client'

export default async function AdminAnalyticsPage() {
  try {
    const [students, tickets, fees, notices, alerts, events] = await Promise.all([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.ticket.count(),
      prisma.feeRecord.findMany(),
      prisma.notice.count({ where: { isActive: true } }),
      prisma.emergencyAlert.count({ where: { isActive: true } }),
      prisma.calendarEvent.count(),
    ])

    const totalFees = fees.reduce((s, f) => s + f.totalAmount, 0)
    const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0)
    const collectionRate = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0

    const openTickets = await prisma.ticket.count({ where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } } })
    const resolvedTickets = await prisma.ticket.count({ where: { status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] } } })
    const resolutionRate = tickets > 0 ? Math.round((resolvedTickets / tickets) * 100) : 0

    const metrics = [
      { label: 'Active Students', value: students, color: '#FAFAFA' },
      { label: 'Total Tickets', value: tickets, color: '#A1A1AA' },
      { label: 'Open Tickets', value: openTickets, color: '#EF4444' },
      { label: 'Resolution Rate', value: `${resolutionRate}%`, color: '#4ADE80' },
      { label: 'Fee Collection', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: '#4ADE80' },
      { label: 'Collection Rate', value: `${collectionRate}%`, color: collectionRate >= 80 ? '#4ADE80' : '#FB923C' },
      { label: 'Active Notices', value: notices, color: '#A1A1AA' },
      { label: 'Active Alerts', value: alerts, color: alerts > 0 ? '#EF4444' : '#4ADE80' },
      { label: 'Calendar Events', value: events, color: '#71717A' },
    ]

    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#FAFAFA' }}>Analytics</h1>
        <p className="text-sm mb-6" style={{ color: '#52525B' }}>Institutional metrics at a glance</p>

        <div className="grid grid-cols-3 gap-4">
          {metrics.map(m => (
            <div key={m.label} className="rounded-2xl p-6" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
              <p className="text-3xl font-black" style={{ color: m.color }}>
                {m.value}
              </p>
              <p className="text-xs mt-2" style={{ color: '#71717A' }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#FAFAFA' }}>Analytics</h1>
        <p className="mt-4" style={{ color: '#71717A' }}>Error loading analytics.</p>
      </div>
    )
  }
}
