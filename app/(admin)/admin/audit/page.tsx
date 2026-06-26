import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export default async function AdminAuditPage() {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#FAFAFA' }}>Audit Logs</h1>
        <p className="text-sm mb-6" style={{ color: '#52525B' }}>System activity trail</p>

        {logs.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <p className="text-sm" style={{ color: '#71717A' }}>No audit logs recorded yet.</p>
            <p className="text-xs mt-1" style={{ color: '#52525B' }}>Activity will appear here as users interact with the system.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            {logs.map((log, i) => (
              <div
                key={log.id}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < logs.length - 1 ? '1px solid #27272A' : 'none' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: '#27272A', color: '#FAFAFA' }}
                >
                  {log.actor?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: '#FAFAFA' }}>
                    <span style={{ color: '#A1A1AA' }}>{log.actor?.name || 'System'}</span> {log.action}
                  </p>
                  <p className="text-[10px]" style={{ color: '#52525B' }}>
                    {log.entityType} {log.entityId ? `#${log.entityId.slice(-6)}` : ''} &middot; {log.actorRole}
                  </p>
                </div>
                <p className="text-[10px] flex-shrink-0" style={{ color: '#52525B' }}>
                  {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#FAFAFA' }}>Audit Logs</h1>
        <p className="mt-4" style={{ color: '#71717A' }}>Error loading audit logs.</p>
      </div>
    )
  }
}
