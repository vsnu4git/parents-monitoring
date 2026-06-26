'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import {
  Calendar, Plus, ChevronLeft, ChevronRight, X, Clock, MapPin,
  Trash2, Edit3, BookOpen, PartyPopper, Megaphone, GraduationCap,
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  type: string
  startDate: string
  endDate: string | null
  department: string | null
  isPublic: boolean
  createdAt: string
}

const EVENT_TYPES = [
  { value: 'EXAM', label: 'Exam', icon: BookOpen, color: '#EF4444' },
  { value: 'HOLIDAY', label: 'Holiday', icon: PartyPopper, color: '#4ADE80' },
  { value: 'EVENT', label: 'Event', icon: Megaphone, color: '#FB923C' },
  { value: 'TIMETABLE', label: 'Timetable', icon: Clock, color: '#FAFAFA' },
  { value: 'ACADEMIC', label: 'Academic', icon: GraduationCap, color: '#A1A1AA' },
  { value: 'OTHER', label: 'Other', icon: Calendar, color: '#71717A' },
]

function getTypeConfig(type: string) {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1]
}

export function CalendarClient({
  events: initialEvents,
  departments,
}: {
  events: CalendarEvent[]
  departments: { code: string; name: string }[]
}) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formType, setFormType] = useState('EVENT')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formDepartment, setFormDepartment] = useState('')
  const [formIsPublic, setFormIsPublic] = useState(true)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start of month to align with weekday grid
  const startDay = monthStart.getDay()
  const paddedDays: (Date | null)[] = [...Array(startDay).fill(null), ...days]

  const dayEvents = (date: Date) =>
    events.filter(e => {
      const start = new Date(e.startDate)
      const end = e.endDate ? new Date(e.endDate) : start
      return date >= new Date(start.toDateString()) && date <= new Date(end.toDateString())
    })

  const selectedDayEvents = selectedDate ? dayEvents(selectedDate) : []

  const openCreateForm = (date?: Date) => {
    setEditingEvent(null)
    setFormTitle('')
    setFormDescription('')
    setFormType('EVENT')
    setFormStartDate(date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
    setFormEndDate('')
    setFormDepartment('')
    setFormIsPublic(true)
    setShowForm(true)
  }

  const openEditForm = (event: CalendarEvent) => {
    setEditingEvent(event)
    setFormTitle(event.title)
    setFormDescription(event.description || '')
    setFormType(event.type)
    setFormStartDate(format(new Date(event.startDate), 'yyyy-MM-dd'))
    setFormEndDate(event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : '')
    setFormDepartment(event.department || '')
    setFormIsPublic(event.isPublic)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !formStartDate) return
    setSaving(true)

    const payload = {
      ...(editingEvent ? { id: editingEvent.id } : {}),
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      type: formType,
      startDate: formStartDate,
      endDate: formEndDate || undefined,
      department: formDepartment || undefined,
      isPublic: formIsPublic,
    }

    const res = await fetch('/api/admin/calendar', {
      method: editingEvent ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setShowForm(false)
      router.refresh()
      // Refetch events
      const eventsRes = await fetch('/api/admin/calendar')
      if (eventsRes.ok) {
        setEvents(await eventsRes.json())
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/calendar?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents(events.filter(e => e.id !== id))
    }
  }

  const upcomingEvents = events
    .filter(e => new Date(e.startDate) >= new Date(new Date().toDateString()))
    .slice(0, 10)

  const inputStyle = {
    backgroundColor: '#18181B',
    border: '1px solid #27272A',
    color: '#FAFAFA',
  }

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#09090B' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5" style={{ color: '#FAFAFA' }} />
            <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>Calendar</h1>
          </div>
          <p className="text-xs" style={{ color: '#52525B' }}>
            Manage events, exams, and timetable schedules
          </p>
        </div>
        <button
          onClick={() => openCreateForm()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#FAFAFA', color: '#09090B' }}
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#71717A' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#27272A')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold" style={{ color: '#FAFAFA' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#71717A' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#27272A')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider py-2" style={{ color: '#52525B' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} />
                const evts = dayEvents(day)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, currentMonth)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className="relative aspect-square rounded-xl flex flex-col items-center justify-start pt-2 transition-all"
                    style={{
                      backgroundColor: isSelected ? '#27272A' : 'transparent',
                      border: isToday ? '1px solid #FAFAFA40' : '1px solid transparent',
                      opacity: isCurrentMonth ? 1 : 0.3,
                    }}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: isToday ? '#FAFAFA' : isSelected ? '#FAFAFA' : '#71717A' }}
                    >
                      {format(day, 'd')}
                    </span>
                    {evts.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {evts.slice(0, 3).map((e, j) => (
                          <div
                            key={j}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: getTypeConfig(e.type).color }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected day events */}
          {selectedDate && (
            <div className="mt-4 rounded-2xl p-5" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold" style={{ color: '#FAFAFA' }}>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                <button
                  onClick={() => openCreateForm(selectedDate)}
                  className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all active:scale-[0.98]"
                  style={{ backgroundColor: '#27272A', color: '#FAFAFA' }}
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: '#52525B' }}>No events on this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map(event => {
                    const typeConfig = getTypeConfig(event.type)
                    const TypeIcon = typeConfig.icon
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ backgroundColor: '#09090B', border: `1px solid #27272A` }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${typeConfig.color}15` }}
                        >
                          <TypeIcon className="w-4 h-4" style={{ color: typeConfig.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>{event.title}</p>
                          {event.description && (
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#52525B' }}>{event.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}>
                              {typeConfig.label}
                            </span>
                            {event.department && (
                              <span className="text-[10px]" style={{ color: '#52525B' }}>{event.department}</span>
                            )}
                            <span className="text-[10px]" style={{ color: '#52525B' }}>
                              {format(new Date(event.startDate), 'h:mm a')}
                              {event.endDate && ` - ${format(new Date(event.endDate), 'h:mm a')}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEditForm(event)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#71717A' }}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#EF4444' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events Sidebar */}
        <div>
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#71717A' }}>
              Upcoming Events
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: '#52525B' }}>No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => {
                  const typeConfig = getTypeConfig(event.type)
                  const TypeIcon = typeConfig.icon
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{ backgroundColor: '#09090B', border: '1px solid #27272A' }}
                      onClick={() => {
                        setSelectedDate(new Date(event.startDate))
                        setCurrentMonth(new Date(event.startDate))
                      }}
                    >
                      <div className="text-center flex-shrink-0" style={{ minWidth: 40 }}>
                        <p className="text-lg font-bold" style={{ color: typeConfig.color }}>
                          {format(new Date(event.startDate), 'd')}
                        </p>
                        <p className="text-[9px] font-bold uppercase" style={{ color: '#52525B' }}>
                          {format(new Date(event.startDate), 'MMM')}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#FAFAFA' }}>{event.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <TypeIcon className="w-3 h-3" style={{ color: typeConfig.color }} />
                          <span className="text-[10px]" style={{ color: '#52525B' }}>{typeConfig.label}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Event Type Legend */}
          <div className="rounded-2xl p-5 mt-4" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#71717A' }}>
              Event Types
            </h3>
            <div className="space-y-2">
              {EVENT_TYPES.map(type => {
                const Icon = type.icon
                return (
                  <div key={type.value} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                    <Icon className="w-3.5 h-3.5" style={{ color: type.color }} />
                    <span className="text-xs" style={{ color: '#A1A1AA' }}>{type.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg mx-4 rounded-2xl p-6"
            style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: '#FAFAFA' }}>
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1" style={{ color: '#52525B' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#A1A1AA' }}>
                  Title
                </label>
                <input
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Internal Assessment 1"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#A1A1AA' }}>
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Optional details..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#A1A1AA' }}>
                    Type
                  </label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#A1A1AA' }}>
                    Department
                  </label>
                  <select
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#A1A1AA' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#A1A1AA' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsPublic}
                  onChange={e => setFormIsPublic(e.target.checked)}
                  className="rounded"
                  style={{ accentColor: '#FAFAFA' }}
                />
                <span className="text-xs" style={{ color: '#A1A1AA' }}>Visible to parents & students</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                  style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formTitle.trim() || !formStartDate}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: '#FAFAFA', color: '#09090B' }}
                >
                  {saving ? 'Saving...' : editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
