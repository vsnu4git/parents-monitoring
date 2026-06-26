import { getStudentSession } from '@/lib/student-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { FileText, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default async function NoticesPage() {
  const session = await getStudentSession()
  if (!session) redirect('/login')

  const notices = await prisma.notice.findMany({
    where: { isActive: true },
    orderBy: { publishedAt: 'desc' },
  })

  function getCategoryStyle(category: string) {
    const c = category.toLowerCase()
    if (c.includes('urgent') || c.includes('emergency')) return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' }
    if (c.includes('exam') || c.includes('academic')) return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' }
    if (c.includes('event') || c.includes('fest')) return { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' }
    return { bg: 'var(--pms-glow)', color: 'var(--pms-text)' }
  }

  return (
    <div className="px-5 pt-5 pb-28 space-y-4" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
          Announcements
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>
          Notices
        </h1>
      </div>

      {/* Notice Count */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{
          backgroundColor: 'var(--pms-card)',
          border: '1px solid var(--pms-border)',
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--pms-text)' }}
        >
          <FileText className="w-6 h-6" style={{ color: 'var(--pms-bg)' }} />
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: 'var(--pms-text)' }}>
            {notices.length}
          </p>
          <p className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>
            Active notice{notices.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Notices List */}
      {notices.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--pms-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--pms-text-muted)' }}>No notices at the moment.</p>
        </div>
      ) : (
        notices.map((notice) => {
          const catStyle = getCategoryStyle(notice.category)
          return (
            <div
              key={notice.id}
              className="rounded-2xl p-4"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--pms-text)' }}>
                  {notice.title}
                </p>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                  style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                >
                  {notice.category}
                </span>
              </div>

              <p
                className="text-xs leading-relaxed line-clamp-3 mb-3"
                style={{ color: 'var(--pms-text-sec)' }}
              >
                {notice.content}
              </p>

              <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--pms-border)' }}>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" style={{ color: 'var(--pms-text-muted)' }} />
                  <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>
                    {format(new Date(notice.publishedAt), 'MMM d, yyyy')}
                  </p>
                </div>
                {notice.expiresAt && (
                  <div className="flex items-center gap-1">
                    <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>
                      Expires: {format(new Date(notice.expiresAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
