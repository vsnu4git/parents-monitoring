import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { CheckCircle, FileText } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function NoticesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })
    if (!parent) return <div className="p-8 text-center" style={{ color: 'var(--pms-text-muted)' }}>Account not found.</div>

    const notices = await prisma.notice.findMany({
      where: { isActive: true },
      include: { acknowledgements: { where: { parentId: parent.id } } },
      orderBy: { publishedAt: 'desc' }
    })

    const pendingAcknowledgements = notices.filter(n => n.requiresAcknowledgement && n.acknowledgements.length === 0).length

    async function acknowledgeNotice(noticeId: string) {
      'use server'
      const { prisma } = await import('@/lib/prisma')
      const { auth } = await import('@/lib/auth')
      const session = await auth()
      if (!session) return
      const p = await prisma.parent.findUnique({ where: { userId: session.user.id } })
      if (!p) return
      try {
        await prisma.noticeAcknowledgement.create({ data: { noticeId, parentId: p.id } })
        revalidatePath('/dashboard/notices')
      } catch {}
    }

    const categoryColors: Record<string, string> = {
      Examination: 'bg-[#A1A1AA]/15 text-[var(--pms-text)]',
      Fee: 'bg-[#F59E0B]/15 text-[#F59E0B]',
      Event: 'bg-[#22C55E]/15 text-[#22C55E]',
      Holiday: 'bg-[#A1A1AA]/15 text-[var(--pms-brown)]',
      General: 'bg-[#A1A1AA]/10 text-[var(--pms-text-sec)]',
    }

    return (
      <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Notices</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>
            {pendingAcknowledgements > 0
              ? `${pendingAcknowledgements} notice${pendingAcknowledgements > 1 ? 's' : ''} require your acknowledgement`
              : 'All caught up'}
          </p>
        </div>

        <div className="space-y-3">
          {notices.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--pms-text-muted)' }} />
              <p style={{ color: 'var(--pms-text-muted)' }}>No notices published</p>
            </div>
          ) : (
            notices.map(notice => {
              const isAcknowledged = notice.acknowledgements.length > 0
              return (
                <div key={notice.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${categoryColors[notice.category] || 'bg-[#A1A1AA]/10 text-[var(--pms-text-sec)]'}`}>
                      {notice.category}
                    </span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--pms-text-muted)' }}>
                      {format(new Date(notice.publishedAt), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm" style={{ color: 'var(--pms-text)' }}>{notice.title}</h3>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--pms-text-sec)' }}>{notice.content}</p>

                  {notice.requiresAcknowledgement && !isAcknowledged && (
                    <div className="mt-3">
                      <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B]">
                        Action Required
                      </span>
                    </div>
                  )}

                  {notice.requiresAcknowledgement && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--pms-border)' }}>
                      {isAcknowledged ? (
                        <p className="text-xs text-[#22C55E] flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Acknowledged on {format(new Date(notice.acknowledgements[0].acknowledgedAt), 'MMM d, yyyy')}
                        </p>
                      ) : (
                        <form action={acknowledgeNotice.bind(null, notice.id)}>
                          <button type="submit" className="w-full h-10 rounded-xl text-sm font-medium active:scale-[0.98] transition-all duration-150" style={{ backgroundColor: 'var(--pms-brown)', color: 'var(--pms-bg)' }}>
                            Acknowledge
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  } catch (error) {
    return <div className="p-8 text-center" style={{ color: 'var(--pms-text-muted)' }}>Error loading notices.</div>
  }
}
