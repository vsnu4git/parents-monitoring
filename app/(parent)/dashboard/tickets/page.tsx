import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { MessageSquare, Plus } from 'lucide-react'

const statusColors: Record<string, string> = {
  OPEN: 'bg-[#A1A1AA]/15 text-[var(--pms-brown)]',
  IN_PROGRESS: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  RESOLVED: 'bg-[#22C55E]/15 text-[#22C55E]',
  CLOSED: 'bg-[#A1A1AA]/15 text-[var(--pms-text-muted)]',
}

const priorityColors: Record<string, string> = {
  URGENT: 'bg-[#EF4444]/15 text-[#EF4444]',
  HIGH: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  NORMAL: 'bg-[#A1A1AA]/15 text-[var(--pms-text-sec)]',
  LOW: 'bg-[#A1A1AA]/10 text-[var(--pms-text-muted)]',
}

export default async function TicketsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: true }
    })
    if (!parent) return <div className="p-8 text-center" style={{ color: 'var(--pms-text-muted)' }}>Account not found.</div>

    const tickets = await prisma.ticket.findMany({
      where: { parentId: parent.id },
      include: { student: true, replies: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' }
    })

    const open = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length

    return (
      <div className="px-5 pt-5 pb-28 space-y-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Support Tickets</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>{open} active ticket{open !== 1 ? 's' : ''}</p>
        </div>

        <Link href="/dashboard/tickets/new" className="block">
          <button className="w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150" style={{ backgroundColor: 'var(--pms-brown)', color: 'var(--pms-bg)' }}>
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </Link>

        {tickets.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--pms-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--pms-text-sec)' }}>No tickets yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--pms-text-muted)' }}>Create a support ticket for any issues or queries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <Link key={t.id} href={`/dashboard/tickets/${t.id}`} className="block">
                <div className="rounded-2xl p-4 active:scale-[0.98] transition-all duration-150" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#A1A1AA]/10" style={{ color: 'var(--pms-text-sec)' }}>
                      {t.category}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority] || 'bg-[#A1A1AA]/10 text-[var(--pms-text-sec)]'}`}>
                      {t.priority}
                    </span>
                  </div>

                  <p className="font-semibold text-sm" style={{ color: 'var(--pms-text)' }}>{t.subject}</p>
                  <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--pms-text-muted)' }}>{t.description}</p>

                  <p className="text-[11px] mt-2" style={{ color: 'var(--pms-text-muted)' }}>
                    {t.student.name} &bull; {format(new Date(t.updatedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  } catch (error) {
    return <div className="p-8 text-center" style={{ color: 'var(--pms-text-muted)' }}>Error loading tickets.</div>
  }
}
