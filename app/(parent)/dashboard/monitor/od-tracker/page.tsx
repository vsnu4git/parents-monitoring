import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
  IN_TRANSIT: { color: '#A1A1AA', bg: 'rgba(161,161,170,0.12)', label: 'In Transit' },
  ARRIVED: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', label: 'Arrived' },
  RETURNED: { color: '#A1A1AA', bg: 'rgba(161,161,170,0.12)', label: 'Returned' },
  MISSED: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Missed' },
}

export default async function ODTrackerPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: true },
    })
    if (!parent || parent.students.length === 0) {
      return <div className="p-8 text-center text-[var(--pms-text-muted)]">No student linked.</div>
    }

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)

    const trips = await prisma.oDTrip.findMany({
      where: { studentId: student.id },
      include: { leaveRecord: true },
      orderBy: { createdAt: 'desc' },
    })

    const activeTrips = trips.filter(t => t.status === 'PENDING' || t.status === 'IN_TRANSIT')
    const historyTrips = trips.filter(t => t.status !== 'PENDING' && t.status !== 'IN_TRANSIT')

    return (
      <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>OD Trip Tracker</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>{student.name} - Track on-duty trips in real time</p>
        </div>

        {/* Active Trips */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--pms-text)' }}>
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            Active Trips ({activeTrips.length})
          </h2>

          {activeTrips.length === 0 ? (
            <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', color: 'var(--pms-text-muted)' }}>
              No active OD trips right now.
            </div>
          ) : (
            <div className="space-y-3">
              {activeTrips.map((trip) => {
                const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.PENDING
                return (
                  <div key={trip.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
                    <div className="p-4" style={{ borderBottom: '1px solid var(--pms-border)' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-semibold" style={{ color: 'var(--pms-text)' }}>{trip.destinationName}</h3>
                          <p className="text-xs mt-1" style={{ color: 'var(--pms-text-muted)' }}>Geofence: {trip.radiusM}m radius</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div>
                          <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Departed</p>
                          <p className="text-sm" style={{ color: 'var(--pms-text)' }}>
                            {trip.departedAt ? format(new Date(trip.departedAt), 'MMM d, h:mm a') : '--'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Arrived</p>
                          <p className="text-sm" style={{ color: 'var(--pms-text)' }}>
                            {trip.arrivedAt ? format(new Date(trip.arrivedAt), 'MMM d, h:mm a') : '--'}
                          </p>
                        </div>
                        {trip.lastLocationAt && (
                          <div>
                            <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Last Update</p>
                            <p className="text-sm" style={{ color: 'var(--pms-text)' }}>
                              {format(new Date(trip.lastLocationAt), 'h:mm a')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative w-full h-[300px]">
                      <iframe
                        src={`https://maps.google.com/maps?q=${trip.destinationLat},${trip.destinationLng}&z=14&output=embed`}
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Map - ${trip.destinationName}`}
                      />
                      <div className="absolute bottom-3 left-3 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)' }}>
                        <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: cfg.color }} />
                        <span className="text-xs" style={{ color: 'var(--pms-text)' }}>{trip.radiusM}m geofence radius</span>
                      </div>
                    </div>

                    {trip.leaveRecord && (
                      <div className="p-3" style={{ borderTop: '1px solid var(--pms-border)', backgroundColor: 'var(--pms-bg)' }}>
                        <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
                          Leave: {trip.leaveRecord.type} | {format(new Date(trip.leaveRecord.startDate), 'MMM d')} - {format(new Date(trip.leaveRecord.endDate), 'MMM d')}
                          {' '}| Reason: {trip.leaveRecord.reason}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Trip History */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--pms-text)' }}>Trip History</h2>

          {historyTrips.length === 0 ? (
            <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', color: 'var(--pms-text-muted)' }}>
              No past OD trips found.
            </div>
          ) : (
            <div className="space-y-3">
              {historyTrips.map((trip) => {
                const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.RETURNED
                return (
                  <div key={trip.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-medium truncate" style={{ color: 'var(--pms-text)' }}>{trip.destinationName}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs" style={{ color: 'var(--pms-text-muted)' }}>
                        <span>{trip.departedAt ? format(new Date(trip.departedAt), 'MMM d, h:mm a') : 'Not departed'}</span>
                        <span>→</span>
                        <span>
                          {trip.returnedAt
                            ? format(new Date(trip.returnedAt), 'MMM d, h:mm a')
                            : trip.arrivedAt
                              ? format(new Date(trip.arrivedAt), 'h:mm a') + ' (arrived)'
                              : '--'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>{trip.radiusM}m radius</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
                        {format(new Date(trip.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  } catch {
    return <div className="p-8 text-center text-[var(--pms-text-muted)]">Error loading OD trips. Please check database connection.</div>
  }
}
