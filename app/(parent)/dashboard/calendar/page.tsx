import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CalendarViewClient } from './calendar-view-client'

export default async function ParentCalendarPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const events = await prisma.calendarEvent.findMany({
    where: { isPublic: true },
    orderBy: { startDate: 'asc' },
  })

  return <CalendarViewClient events={JSON.parse(JSON.stringify(events))} />
}
