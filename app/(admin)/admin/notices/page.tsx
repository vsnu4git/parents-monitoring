import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, FileText, CheckCircle, Clock } from 'lucide-react'

export default async function AdminNoticesPage() {
  try {
    const notices = await prisma.notice.findMany({
      include: { _count: { select: { acknowledgements: true } } },
      orderBy: { publishedAt: 'desc' }
    })

    const totalParents = await prisma.parent.count()

    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>
              Notices
            </h1>
            <span
              className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
            >
              {notices.length}
            </span>
          </div>
          <Link
            href="/admin/notices/new"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#FAFAFA', color: '#09090B' }}
          >
            <Plus className="w-4 h-4" />
            New
          </Link>
        </div>

        {/* Notice list */}
        <div className="space-y-3">
          {notices.length === 0 ? (
            <div
              className="rounded-2xl py-16 text-center"
              style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
            >
              <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: '#52525B' }} />
              <p className="text-sm" style={{ color: '#71717A' }}>No notices published yet</p>
            </div>
          ) : (
            notices.map(n => (
              <div
                key={n.id}
                className="rounded-2xl p-4 transition-colors"
                style={{
                  backgroundColor: '#18181B',
                  border: '1px solid #27272A',
                  opacity: n.isActive ? 1 : 0.55,
                }}
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-sm leading-snug" style={{ color: '#FAFAFA' }}>
                    {n.title}
                  </h3>
                  {n.isActive ? (
                    <span
                      className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
                      Active
                    </span>
                  ) : (
                    <span
                      className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: '#27272A', color: '#71717A' }}
                    >
                      Expired
                    </span>
                  )}
                </div>

                {/* Category pill + date */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
                  >
                    {n.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: '#71717A' }}>
                    <Clock className="w-3 h-3" />
                    {format(new Date(n.publishedAt), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Content preview */}
                <p
                  className="text-xs leading-relaxed mb-3"
                  style={{
                    color: '#A1A1AA',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {n.content}
                </p>

                {/* Acknowledgement count */}
                {n.requiresAcknowledgement && (
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ backgroundColor: '#09090B' }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                    <span className="text-xs font-medium" style={{ color: '#FAFAFA' }}>
                      {n._count.acknowledgements}
                    </span>
                    <span className="text-xs" style={{ color: '#52525B' }}>
                      / {totalParents} acknowledged
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090B' }}>
        <p className="text-sm" style={{ color: '#71717A' }}>Error loading notices.</p>
      </div>
    )
  }
}
