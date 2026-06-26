import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { Bell, AlertTriangle, CreditCard, BookOpen, Calendar, MessageSquare } from 'lucide-react'

const notificationIcons: Record<string, React.ElementType> = {
  LOW_ATTENDANCE: AlertTriangle, CONSECUTIVE_ABSENCE: AlertTriangle,
  FEE_DUE: CreditCard, MARKS_PUBLISHED: BookOpen,
  EXAM_REMINDER: Calendar, TICKET_UPDATE: MessageSquare,
}

const iconColors: Record<string, string> = {
  LOW_ATTENDANCE: 'text-[#F59E0B]',
  CONSECUTIVE_ABSENCE: 'text-[#EF4444]',
  FEE_DUE: 'text-[#F59E0B]',
  MARKS_PUBLISHED: 'text-[var(--pms-brown)]',
  EXAM_REMINDER: 'text-[var(--pms-text)]',
  TICKET_UPDATE: 'text-[#22C55E]',
}

const iconBgColors: Record<string, string> = {
  LOW_ATTENDANCE: 'bg-[#F59E0B]/10',
  CONSECUTIVE_ABSENCE: 'bg-[#EF4444]/10',
  FEE_DUE: 'bg-[#F59E0B]/10',
  MARKS_PUBLISHED: 'bg-[#A1A1AA]/10',
  EXAM_REMINDER: 'bg-[#A1A1AA]/10',
  TICKET_UPDATE: 'bg-[#22C55E]/10',
}

const priorityBadgeColors: Record<string, string> = {
  CRITICAL: 'bg-[#EF4444]/15 text-[#EF4444]',
  HIGH: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  MEDIUM: 'bg-[#A1A1AA]/15 text-[var(--pms-text-sec)]',
  LOW: 'bg-[#A1A1AA]/10 text-[var(--pms-text-muted)]',
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: true }
    })
    if (!parent) return <div className="p-8 text-center" style={{ color: 'var(--pms-text-muted)' }}>Account not found.</div>

    const studentIds = parent.students.map(s => s.id)
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { studentId: { in: studentIds } },
          { targetRole: 'PARENT', studentId: null }
        ]
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    })

    const unread = notifications.filter(n => !n.isRead).length

    return (
      <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--pms-text-muted)' }} />
            <p style={{ color: 'var(--pms-text-muted)' }}>No notifications</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            {notifications.map((n, i) => {
              const Icon = notificationIcons[n.type] || Bell
              const textColor = iconColors[n.type] || 'text-[var(--pms-brown)]'
              const bgColor = iconBgColors[n.type] || 'bg-[#A1A1AA]/10'
              const isUnread = !n.isRead
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3.5 ${isUnread ? 'border-l-2 border-l-[var(--pms-brown)]' : ''}`}
                  style={{
                    borderBottom: i < notifications.length - 1 ? '1px solid var(--pms-border)' : 'none',
                    backgroundColor: isUnread ? 'var(--pms-card)' : 'var(--pms-bg)',
                  }}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                    <Icon className={`w-4 h-4 ${textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: isUnread ? 'var(--pms-text)' : 'var(--pms-text-sec)' }}>
                      {n.title}
                    </p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--pms-text-muted)' }}>{n.message}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--pms-text-muted)' }}>{format(new Date(n.createdAt), 'MMM d, h:mm a')}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${priorityBadgeColors[n.priority] || 'bg-[#A1A1AA]/10 text-[var(--pms-text-muted)]'}`}>
                    {n.priority}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  } catch (error) {
    return <div className="p-8 text-center" style={{ color: 'var(--pms-text-muted)' }}>Error loading notifications.</div>
  }
}
