'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import {
  Calendar, ChevronLeft, ChevronRight, Clock,
  BookOpen, PartyPopper, Megaphone, GraduationCap,
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  type: string
  startDate: string
  endDate: string | null
  department: string | null
}

const EVENT_TYPES: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
  EXAM: { label: 'Exam', icon: BookOpen, color: '#EF4444' },
  HOLIDAY: { label: 'Holiday', icon: PartyPopper, color: '#22C55E' },
  EVENT: { label: 'Event', icon: Megaphone, color: '#F59E0B' },
  TIMETABLE: { label: 'Timetable', icon: Clock, color: '#A1A1AA' },
  ACADEMIC: { label: 'Academic', icon: GraduationCap, color: '#71717A' },
  OTHER: { label: 'Other', icon: Calendar, color: '#52525B' },
}

function getTypeConfig(type: string) {
  return EVENT_TYPES[type] || EVENT_TYPES.OTHER
}

export function CalendarViewClient({ events }: { events: CalendarEvent[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = monthStart.getDay()
  const paddedDays: (Date | null)[] = [...Array(startDay).fill(null), ...days]

  const dayEvents = (date: Date) =>
    events.filter(e => {
      const start = new Date(e.startDate)
      const end = e.endDate ? new Date(e.endDate) : start
      return date >= new Date(start.toDateString()) && date <= new Date(end.toDateString())
    })

  const selectedDayEvents = selectedDate ? dayEvents(selectedDate) : []
  const upcomingEvents = events
    .filter(e => new Date(e.startDate) >= new Date(new Date().toDateString()))
    .slice(0, 8)

  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-5 h-5" style={{ color: 'var(--pms-brown)' }} />
        <p className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: 'var(--pms-text-muted)' }}>
          Calendar
        </p>
      </div>
      <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--pms-text)' }}>
        Events & Schedule
      </h1>

      {/* Calendar Grid */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg active:scale-[0.98] transition-all duration-150" style={{ color: 'var(--pms-text-muted)' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold" style={{ color: 'var(--pms-text)' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg active:scale-[0.98] transition-all duration-150" style={{ color: 'var(--pms-text-muted)' }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-bold uppercase py-1" style={{ color: 'var(--pms-text-muted)' }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {paddedDays.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />
            const evts = dayEvents(day)
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center relative active:scale-[0.98] transition-all duration-150"
                style={{
                  backgroundColor: isSelected ? 'var(--pms-border)' : 'transparent',
                  border: isToday ? '1px solid var(--pms-brown)' : '1px solid transparent',
                  opacity: isSameMonth(day, currentMonth) ? 1 : 0.3,
                }}
              >
                <span className="text-xs font-medium" style={{ color: isToday ? 'var(--pms-brown)' : 'var(--pms-text-sec)' }}>
                  {format(day, 'd')}
                </span>
                {evts.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {evts.slice(0, 2).map((e, j) => (
                      <div key={j} className="w-1 h-1 rounded-full" style={{ backgroundColor: getTypeConfig(e.type).color }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDate && selectedDayEvents.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-bold px-1" style={{ color: 'var(--pms-text-muted)' }}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </p>
          {selectedDayEvents.map(event => {
            const typeConfig = getTypeConfig(event.type)
            const TypeIcon = typeConfig.icon
            return (
              <div
                key={event.id}
                className="rounded-2xl p-3 flex items-start gap-3"
                style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${typeConfig.color}15` }}
                >
                  <TypeIcon className="w-4 h-4" style={{ color: typeConfig.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>{event.title}</p>
                  {event.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>{event.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}>
                      {typeConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upcoming Events */}
      <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--pms-text-muted)' }}>
          Upcoming
        </p>
        {upcomingEvents.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--pms-text-muted)' }}>No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event, i) => {
              const typeConfig = getTypeConfig(event.type)
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 py-2 cursor-pointer"
                  style={{ borderBottom: i < upcomingEvents.length - 1 ? '1px solid var(--pms-border)' : 'none' }}
                  onClick={() => {
                    setSelectedDate(new Date(event.startDate))
                    setCurrentMonth(new Date(event.startDate))
                  }}
                >
                  <div className="text-center flex-shrink-0" style={{ minWidth: 36 }}>
                    <p className="text-sm font-bold" style={{ color: typeConfig.color }}>
                      {format(new Date(event.startDate), 'd')}
                    </p>
                    <p className="text-[8px] font-bold uppercase" style={{ color: 'var(--pms-text-muted)' }}>
                      {format(new Date(event.startDate), 'MMM')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--pms-text)' }}>{event.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{typeConfig.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
