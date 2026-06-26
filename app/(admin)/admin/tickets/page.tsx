import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import Link from 'next/link'

const statusConfig: Record<string, { color: string; bg: string }> = {
  OPEN: { color: '#FB923C', bg: '#FB923C18' },
  IN_PROGRESS: { color: '#60A5FA', bg: '#60A5FA18' },
  RESOLVED: { color: '#4ADE80', bg: '#4ADE8018' },
  CLOSED: { color: '#52525B', bg: '#52525B18' },
}

const priorityConfig: Record<string, { color: string; bg: string }> = {
  LOW: { color: '#52525B', bg: '#52525B18' },
  MEDIUM: { color: '#A1A1AA', bg: '#A1A1AA18' },
  HIGH: { color: '#FB923C', bg: '#FB923C18' },
  URGENT: { color: '#EF4444', bg: '#EF444418' },
}

export default async function AdminTicketsPage() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        parent: { include: { user: true } },
        student: true,
        replies: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    })

    const open = tickets.filter(t => t.status === 'OPEN').length
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length
    const resolved = tickets.filter(t => t.status === 'RESOLVED').length

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#09090B' }}>
        <div className="p-8 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>
              Tickets
            </h1>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#FB923C18', color: '#FB923C' }}
              >
                {open} open
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#4ADE8018', color: '#4ADE80' }}
              >
                {resolved} resolved
              </span>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="flex gap-2">
            <div
              className="flex-1 rounded-2xl px-3 py-3 text-center"
              style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
            >
              <p className="text-lg font-bold" style={{ color: '#FB923C' }}>{open}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: '#71717A' }}>Open</p>
            </div>
            <div
              className="flex-1 rounded-2xl px-3 py-3 text-center"
              style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
            >
              <p className="text-lg font-bold" style={{ color: '#60A5FA' }}>{inProgress}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: '#71717A' }}>In Progress</p>
            </div>
            <div
              className="flex-1 rounded-2xl px-3 py-3 text-center"
              style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
            >
              <p className="text-lg font-bold" style={{ color: '#4ADE80' }}>{resolved}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: '#71717A' }}>Resolved</p>
            </div>
          </div>

          {/* Ticket Cards */}
          {tickets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: '#52525B' }}>No tickets yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => {
                const sc = statusConfig[t.status] || statusConfig.OPEN
                const pc = priorityConfig[t.priority] || priorityConfig.MEDIUM

                return (
                  <Link key={t.id} href={`/admin/tickets/${t.id}`}>
                    <div
                      className="rounded-2xl p-4 space-y-2.5 transition-colors"
                      style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
                    >
                      {/* Status + pills row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: sc.bg, color: sc.color }}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
                        >
                          {t.category}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: pc.bg, color: pc.color }}
                        >
                          {t.priority}
                        </span>
                        {t.replies.length === 0 && t.status === 'OPEN' && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#EF444418', color: '#EF4444' }}
                          >
                            No reply
                          </span>
                        )}
                      </div>

                      {/* Subject */}
                      <p className="font-semibold text-sm" style={{ color: '#FAFAFA' }}>
                        {t.subject}
                      </p>

                      {/* Parent + Student + Time */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs truncate" style={{ color: '#A1A1AA' }}>
                          {t.parent.user.name}
                          <span style={{ color: '#52525B' }}> &middot; </span>
                          {t.student.name}
                        </p>
                        <span className="text-[10px] shrink-0 ml-2" style={{ color: '#52525B' }}>
                          {format(new Date(t.updatedAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090B' }}>
        <p className="text-sm" style={{ color: '#52525B' }}>Error loading tickets.</p>
      </div>
    )
  }
}
