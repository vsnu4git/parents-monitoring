import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import { TicketReplyForm } from '@/components/tickets/ticket-reply-form'

const statusColors: Record<string, string> = {
  OPEN: 'bg-[#A1A1AA]/15 text-[var(--pms-brown)]',
  IN_PROGRESS: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  RESOLVED: 'bg-[#22C55E]/15 text-[#22C55E]',
  CLOSED: 'bg-[#A1A1AA]/15 text-[#A1A1AA]',
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
    if (!parent) redirect('/login')

    const ticket = await prisma.ticket.findUnique({
      where: { id, parentId: parent.id },
      include: {
        student: true,
        replies: { include: { sender: true }, orderBy: { createdAt: 'asc' } }
      }
    })

    if (!ticket) notFound()

    return (
      <div className="px-5 pt-5 pb-32 space-y-4" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
        {/* Ticket info card */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ticket.status]}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#A1A1AA]/10" style={{ color: 'var(--pms-text-sec)' }}>
              {ticket.category}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ticket.priority === 'URGENT' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#A1A1AA]/10'}`} style={{ color: ticket.priority === 'URGENT' ? undefined : 'var(--pms-text-sec)' }}>
              {ticket.priority}
            </span>
          </div>

          <h2 className="text-base font-bold" style={{ color: 'var(--pms-text)' }}>{ticket.subject}</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--pms-text-muted)' }}>
            {ticket.student.name} &bull; {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
          </p>

          <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--pms-text-sec)' }}>{ticket.description}</p>
          </div>
        </div>

        {/* Conversation */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: 'var(--pms-text-muted)' }}>Conversation</p>

          {ticket.replies.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--pms-text-muted)' }}>No replies yet. We will respond within 2 working days.</p>
          ) : (
            ticket.replies.map(r => {
              const isParent = r.senderRole === 'PARENT'
              return (
                <div key={r.id} className={`flex ${isParent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${isParent ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed" style={{
                      backgroundColor: isParent ? 'var(--pms-brown)' : 'var(--pms-card)',
                      color: isParent ? 'var(--pms-bg)' : 'var(--pms-text-sec)',
                      border: isParent ? 'none' : '1px solid var(--pms-border)',
                      borderBottomRightRadius: isParent ? '4px' : undefined,
                      borderBottomLeftRadius: isParent ? undefined : '4px',
                    }}>
                      {r.message}
                    </div>
                    <p className={`text-[10px] mt-1 ${isParent ? 'text-right' : 'text-left'} px-1`} style={{ color: 'var(--pms-text-muted)' }}>
                      {r.sender.name} &bull; {format(new Date(r.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Sticky reply form */}
        {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
          <div className="fixed bottom-0 left-0 right-0 p-4" style={{ backgroundColor: 'var(--pms-card)', borderTop: '1px solid var(--pms-border)' }}>
            <TicketReplyForm ticketId={ticket.id} parentId={parent.id} />
          </div>
        )}
      </div>
    )
  } catch (error) {
    return <div className="p-8 text-center" style={{ color: 'var(--pms-text-muted)' }}>Error loading ticket.</div>
  }
}
