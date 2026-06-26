import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CalendarClient } from './calendar-client'

export default async function CalendarPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const events = await prisma.calendarEvent.findMany({
    orderBy: { startDate: 'asc' },
  })

  const departments = await prisma.department.findMany({
    select: { code: true, name: true },
    orderBy: { code: 'asc' },
  })

  return (
    <CalendarClient
      events={JSON.parse(JSON.stringify(events))}
      departments={departments}
    />
  )
}
