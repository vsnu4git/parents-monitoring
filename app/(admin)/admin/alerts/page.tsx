import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, Megaphone, CheckCircle } from 'lucide-react'

function severityStyle(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return {
        borderColor: '#EF4444',
        boxShadow: '0 0 12px 0 rgba(239,68,68,0.15), inset 0 0 0 1px rgba(239,68,68,0.25)',
        pillBg: 'rgba(239,68,68,0.12)',
        pillColor: '#EF4444',
      }
    case 'WARNING':
      return {
        borderColor: '#FB923C',
        boxShadow: 'inset 0 0 0 1px rgba(251,146,60,0.25)',
        pillBg: 'rgba(251,146,60,0.12)',
        pillColor: '#FB923C',
      }
    default:
      return {
        borderColor: '#27272A',
        boxShadow: 'none',
        pillBg: 'rgba(250,250,250,0.08)',
        pillColor: '#A1A1AA',
      }
  }
}

export default async function AdminAlertsPage() {
  try {
    const alerts = await prisma.emergencyAlert.findMany({
      include: { _count: { select: { acknowledgements: true } } },
      orderBy: { publishedAt: 'desc' }
    })
    const totalParents = await prisma.parent.count()
    const activeCount = alerts.filter(a => a.isActive).length

    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>
              Emergency Alerts
            </h1>
            <span
              className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
            >
              {activeCount} active
            </span>
          </div>
          <Link
            href="/admin/alerts/new"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#FAFAFA', color: '#09090B' }}
          >
            <Plus className="w-4 h-4" />
            New Alert
          </Link>
        </div>

        {/* Alert list */}
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div
              className="rounded-2xl py-16 text-center"
              style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
            >
              <Megaphone className="w-10 h-10 mx-auto mb-3" style={{ color: '#52525B' }} />
              <p className="text-sm" style={{ color: '#71717A' }}>No alerts sent</p>
            </div>
          ) : (
            alerts.map(a => {
              const sev = severityStyle(a.severity)
              return (
                <div
                  key={a.id}
                  className="rounded-2xl p-4 transition-colors"
                  style={{
                    backgroundColor: '#18181B',
                    borderWidth: '1px',
                    borderColor: sev.borderColor,
                    boxShadow: sev.boxShadow,
                    opacity: a.isActive ? 1 : 0.55,
                  }}
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: '#FAFAFA' }}>
                      {a.title}
                    </h3>
                    {a.isActive ? (
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

                  {/* Severity pill + target scope */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: sev.pillBg, color: sev.pillColor }}
                    >
                      {a.severity}
                    </span>
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
                    >
                      {a.targetScope}
                    </span>
                    <span className="text-[11px]" style={{ color: '#71717A' }}>
                      {format(new Date(a.publishedAt), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>

                  {/* Message preview */}
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
                    {a.message}
                  </p>

                  {/* Acknowledgement count */}
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ backgroundColor: '#09090B' }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                    <span className="text-xs font-medium" style={{ color: '#FAFAFA' }}>
                      {a._count.acknowledgements}
                    </span>
                    <span className="text-xs" style={{ color: '#52525B' }}>
                      / {totalParents} acknowledged
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090B' }}>
        <p className="text-sm" style={{ color: '#71717A' }}>Error loading alerts.</p>
      </div>
    )
  }
}
