import { getStudentSession } from '@/lib/student-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Calendar, Clock, MapPin, Tag } from 'lucide-react'
import { format, isToday, isTomorrow, isBefore, startOfDay } from 'date-fns'

export default async function CalendarPage() {
  const session = await getStudentSession()
  if (!session) redirect('/login')

  const now = new Date()

  const events = await prisma.calendarEvent.findMany({
    where: { isPublic: true },
    orderBy: { startDate: 'asc' },
  })

  const upcomingEvents = events.filter(e => !isBefore(new Date(e.startDate), startOfDay(now)))
  const pastEvents = events.filter(e => isBefore(new Date(e.startDate), startOfDay(now))).reverse()

  function getDateLabel(date: Date) {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEEE, MMM d')
  }

  function getTypeColor(type: string) {
    const t = type.toLowerCase()
    if (t.includes('exam')) return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' }
    if (t.includes('holiday')) return { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' }
    if (t.includes('event') || t.includes('fest')) return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' }
    return { bg: 'var(--pms-glow)', color: 'var(--pms-text)' }
  }

  return (
    <div className="px-5 pt-5 pb-28 space-y-4" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
          Calendar
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>
          Events & Schedule
        </h1>
      </div>

      {/* Today's Date Card */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{
          backgroundColor: 'var(--pms-card)',
          border: '1px solid var(--pms-border)',
        }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--pms-text)' }}
        >
          <Calendar className="w-7 h-7" style={{ color: 'var(--pms-bg)' }} />
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
            Today
          </p>
          <p className="text-lg font-bold" style={{ color: 'var(--pms-text)' }}>
            {format(now, 'EEEE, MMMM d')}
          </p>
          <p className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>
            {upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--pms-text)' }}>Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--pms-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--pms-text-muted)' }}>No upcoming events.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.startDate)
              const typeStyle = getTypeColor(event.type)
              return (
                <div
                  key={event.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="text-center flex-shrink-0 rounded-xl p-2"
                      style={{ backgroundColor: 'var(--pms-glow)', minWidth: 48 }}
                    >
                      <p className="text-lg font-bold leading-none" style={{ color: 'var(--pms-text)' }}>
                        {format(eventDate, 'd')}
                      </p>
                      <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--pms-text-muted)' }}>
                        {format(eventDate, 'MMM')}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--pms-text)' }}>
                          {event.title}
                        </p>
                      </div>
                      {event.description && (
                        <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--pms-text-sec)' }}>
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center flex-wrap gap-2">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}
                        >
                          {event.type}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" style={{ color: 'var(--pms-text-muted)' }} />
                          <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>
                            {getDateLabel(eventDate)}
                          </p>
                        </div>
                        {event.department && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" style={{ color: 'var(--pms-text-muted)' }} />
                            <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>
                              {event.department}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--pms-text-muted)' }}>Past Events</h2>
          <div className="space-y-2">
            {pastEvents.slice(0, 10).map((event) => {
              const eventDate = new Date(event.startDate)
              return (
                <div
                  key={event.id}
                  className="rounded-2xl p-3 flex items-center gap-3 opacity-60"
                  style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
                >
                  <div className="text-center flex-shrink-0" style={{ minWidth: 36 }}>
                    <p className="text-sm font-bold leading-none" style={{ color: 'var(--pms-text-muted)' }}>
                      {format(eventDate, 'd')}
                    </p>
                    <p className="text-[8px] font-bold uppercase" style={{ color: 'var(--pms-text-muted)' }}>
                      {format(eventDate, 'MMM')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--pms-text-muted)' }}>
                      {event.title}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{event.type}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
