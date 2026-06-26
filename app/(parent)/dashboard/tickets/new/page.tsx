import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NewTicketForm } from '@/components/tickets/new-ticket-form'

export default async function NewTicketPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: true }
  })

  if (!parent || parent.students.length === 0) {
    return (
      <div className="px-4 pt-6 pb-8">
        <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-[#2A2520]">
          <p className="text-[#6B5E4D] text-sm">No student linked to raise a ticket.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#F5F0E8]">Create Support Ticket</h1>
        <p className="text-sm text-[#9B8E7B] mt-0.5">Raise an issue or query to the administration</p>
      </div>
      <NewTicketForm
        parentId={parent.id}
        students={parent.students.map(s => ({ id: s.id, name: s.name, registerNumber: s.registerNumber }))}
      />
    </div>
  )
}
