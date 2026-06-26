'use client'

import { format, formatDistanceToNow } from 'date-fns'
import {
  MapPin, Navigation, Coffee, UtensilsCrossed, Cookie, Moon,
  AlertTriangle, Wallet, ChevronRight, Clock, Locate,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const TrackingMap = dynamic(() => import('@/components/tracking-map'), { ssr: false })

interface MonitorData {
  student: {
    id: string; name: string; registerNumber: string
    year: number; semester: number
    department: { name: string; code: string }
  }
  isOnCampus: boolean
  lastCheckIn: {
    id: string; latitude: number; longitude: number
    label: string | null; type: string; createdAt: string
  } | null
  todayCheckIns: {
    id: string; latitude: number; longitude: number
    label: string | null; type: string; createdAt: string
  }[]
  activeODTrips: {
    id: string; destinationName: string
    destinationLat: number; destinationLng: number
    radiusM: number; status: string
    departedAt: string | null
    lastLat: number | null; lastLng: number | null
    lastLocationAt: string | null; createdAt: string
  }[]
  recentAlerts: {
    id: string; type: string; message: string
    latitude: number | null; longitude: number | null
    isRead: boolean; createdAt: string
  }[]
  campusAccount: {
    id: string; campusOneId: string; balance: number; isConnected: boolean
    transactions: {
      id: string; category: string; vendor: string
      description: string; amount: number; transactionAt: string
    }[]
  } | null
  todayFood: {
    id: string; mealType: string; items: string
    vendor: string; amount: number; loggedAt: string
  }[]
  zones: {
    id: string; name: string
    latitude: number; longitude: number; radiusM: number
  }[]
}

const MEAL_ICONS: Record<string, typeof Coffee> = {
  BREAKFAST: Coffee, LUNCH: UtensilsCrossed, SNACKS: Cookie, DINNER: Moon,
}
const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'B\'fast', LUNCH: 'Lunch', SNACKS: 'Snack', DINNER: 'Dinner',
}
const OD_COLORS: Record<string, string> = {
  PENDING: '#F59E0B', IN_TRANSIT: '#A1A1AA', ARRIVED: '#22C55E',
  RETURNED: '#A1A1AA', MISSED: '#EF4444',
}
const ALERT_COLORS: Record<string, string> = {
  LEFT_CAMPUS: '#EF4444', ARRIVED_CAMPUS: '#22C55E',
  MISSED_CHECKIN: '#EF4444', UNUSUAL_LOCATION: '#F59E0B',
}

export function MonitorClient({ data }: { data: MonitorData }) {
  const {
    student, isOnCampus, lastCheckIn, todayCheckIns,
    activeODTrips, recentAlerts, campusAccount, todayFood, zones,
  } = data

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const todayTxns = campusAccount?.transactions.filter(t => t.transactionAt >= todayStart) || []
  const totalSpent = todayTxns.reduce((s, t) => s + t.amount, 0)

  const loggedMeals = new Set(todayFood.map(f => f.mealType))
  const hour = new Date().getHours()
  const expected: string[] = []
  if (hour >= 9) expected.push('BREAKFAST')
  if (hour >= 14) expected.push('LUNCH')
  if (hour >= 18) expected.push('SNACKS')
  if (hour >= 21) expected.push('DINNER')
  const missed = expected.filter(m => !loggedMeals.has(m))
  const mealsCount = todayFood.length

  const unreadAlerts = recentAlerts.filter(a => !a.isRead).length

  const mealDonut = [
    { value: mealsCount, fill: mealsCount >= 3 ? '#22C55E' : mealsCount >= 2 ? '#F59E0B' : '#EF4444' },
    { value: 4 - mealsCount, fill: 'var(--pms-border)' },
  ]

  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>

      {/* Header */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: 'var(--pms-text-muted)' }}>
          Monitoring
        </p>
        <p className="text-xl font-black mt-1" style={{ color: 'var(--pms-text)' }}>
          {student.name}
        </p>
      </div>

      {/* Map */}
      <div className="mb-3">
        {lastCheckIn ? (
          <TrackingMap
            studentName={student.name}
            isOnCampus={isOnCampus}
            currentLat={lastCheckIn.latitude}
            currentLng={lastCheckIn.longitude}
            lastSeenTime={format(new Date(lastCheckIn.createdAt), 'h:mm a')}
            checkInHistory={todayCheckIns.map(c => ({
              lat: c.latitude,
              lng: c.longitude,
              type: c.type,
              time: format(new Date(c.createdAt), 'h:mm a'),
            }))}
            campusZones={zones.map(z => ({
              name: z.name,
              lat: z.latitude,
              lng: z.longitude,
              radiusM: z.radiusM,
            }))}
            odTrip={activeODTrips.length > 0 ? {
              destinationName: activeODTrips[0].destinationName,
              destLat: activeODTrips[0].destinationLat,
              destLng: activeODTrips[0].destinationLng,
              radiusM: activeODTrips[0].radiusM,
              status: activeODTrips[0].status,
              lastLat: activeODTrips[0].lastLat || undefined,
              lastLng: activeODTrips[0].lastLng || undefined,
            } : null}
          />
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <Locate className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--pms-text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>No location data yet</p>
          </div>
        )}
      </div>

      <div className="space-y-3">

        {/* Quick Glance */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-2xl py-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-lg font-black" style={{ color: 'var(--pms-text)' }}>{todayCheckIns.length}</p>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Check-ins</p>
          </div>
          <div className="flex-1 rounded-2xl py-2 text-center relative" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <div className="mx-auto" style={{ width: 36, height: 36 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mealDonut} cx="50%" cy="50%" innerRadius={12} outerRadius={17} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                    {mealDonut.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Meals {mealsCount}/4</p>
          </div>
          <div className="flex-1 rounded-2xl py-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-base font-black" style={{ color: 'var(--pms-brown)' }}>₹{totalSpent}</p>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Spent</p>
          </div>
          <div className="flex-1 rounded-2xl py-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: `1px solid ${unreadAlerts > 0 ? '#EF444440' : 'var(--pms-border)'}` }}>
            <p className="text-lg font-black" style={{ color: unreadAlerts > 0 ? '#EF4444' : 'var(--pms-text-muted)' }}>{unreadAlerts}</p>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Alerts</p>
          </div>
        </div>

        {/* Active OD Trip */}
        {activeODTrips.map(trip => {
          const tripColor = OD_COLORS[trip.status] || '#A1A1AA'
          return (
            <Link key={trip.id} href="/dashboard/monitor/od-tracker">
              <div
                className="rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all duration-150"
                style={{ backgroundColor: 'var(--pms-card)', border: `1px solid ${tripColor}30` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${tripColor}12` }}
                >
                  <Navigation className="w-5 h-5" style={{ color: tripColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--pms-text)' }}>{trip.destinationName}</p>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>
                    {trip.departedAt ? `Departed ${format(new Date(trip.departedAt), 'h:mm a')}` : 'Departure pending'}
                    {trip.lastLocationAt && ` · Ping ${formatDistanceToNow(new Date(trip.lastLocationAt), { addSuffix: true })}`}
                  </p>
                </div>
                <span
                  className="text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `${tripColor}15`, color: tripColor }}
                >
                  {trip.status.replace('_', ' ')}
                </span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pms-text-muted)' }} />
              </div>
            </Link>
          )
        })}

        {/* Food Today */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>
              Today&apos;s Meals
            </p>
            {missed.length > 0 && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EF44441A', color: '#EF4444' }}>
                {missed.length} skipped
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'] as const).map(m => {
              const Icon = MEAL_ICONS[m]
              const eaten = loggedMeals.has(m)
              const isMissed = expected.includes(m) && !eaten
              const upcoming = !expected.includes(m) && !eaten
              const food = todayFood.find(f => f.mealType === m)
              const accent = eaten ? '#22C55E' : isMissed ? '#EF4444' : 'var(--pms-text-muted)'
              return (
                <div key={m} className="text-center" style={{ opacity: upcoming ? 0.3 : 1 }}>
                  <div
                    className="w-full aspect-square rounded-xl flex flex-col items-center justify-center mb-1.5"
                    style={{ backgroundColor: `${eaten ? '#22C55E' : isMissed ? '#EF4444' : '#A1A1AA'}10`, border: `1px solid ${eaten ? '#22C55E' : isMissed ? '#EF4444' : '#A1A1AA'}25` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                    {food && (
                      <p className="text-[9px] font-bold mt-1" style={{ color: accent }}>₹{food.amount}</p>
                    )}
                    {isMissed && (
                      <AlertTriangle className="w-3 h-3 mt-0.5" style={{ color: '#EF4444' }} />
                    )}
                  </div>
                  <p className="text-[9px] font-semibold" style={{ color: eaten ? 'var(--pms-text-sec)' : 'var(--pms-text-muted)' }}>
                    {MEAL_LABELS[m]}
                  </p>
                  {food && (
                    <p className="text-[8px] mt-0.5 line-clamp-1 px-0.5" style={{ color: 'var(--pms-text-muted)' }}>
                      {food.items.split(',')[0].split('(')[0].trim()}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Campus Spending */}
        <Link href="/dashboard/monitor/expenses">
          <div className="rounded-2xl p-4 active:scale-[0.98] transition-all duration-150" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>
                CampusOne
              </p>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--pms-text-muted)' }} />
            </div>
            {!campusAccount ? (
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5" style={{ color: 'var(--pms-text-muted)' }} />
                <div className="flex-1">
                  <p className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>Not connected</p>
                </div>
                <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-[0.98] transition-all duration-150" style={{ backgroundColor: 'var(--pms-brown)', color: 'var(--pms-bg)' }}>
                  Connect
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-black" style={{ color: 'var(--pms-brown)' }}>
                      ₹{totalSpent}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>spent today</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--pms-text-muted)' }}>
                      ₹{campusAccount.balance.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>balance</p>
                  </div>
                </div>
                {todayTxns.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--pms-border)' }}>
                    {todayTxns.slice(0, 3).map((t, i) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 py-2.5"
                        style={{ borderBottom: i < Math.min(todayTxns.length, 3) - 1 ? '1px solid var(--pms-border)' : 'none' }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--pms-brown)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate" style={{ color: 'var(--pms-text-sec)' }}>{t.description}</p>
                          <p className="text-[9px]" style={{ color: 'var(--pms-text-muted)' }}>
                            {t.vendor} · {format(new Date(t.transactionAt), 'h:mm a')}
                          </p>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--pms-brown)' }}>₹{t.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Link>

        {/* Timeline */}
        {todayCheckIns.length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--pms-text-muted)' }}>
              Activity
            </p>
            <div className="relative ml-2">
              <div className="absolute left-[4px] top-2 bottom-2 w-px" style={{ backgroundColor: 'var(--pms-border)' }} />
              {todayCheckIns.slice(0, 5).map((c, i) => {
                const isEntry = c.type === 'CAMPUS_ENTRY' || c.type === 'AUTO'
                const color = isEntry ? '#22C55E' : '#EF4444'
                return (
                  <div key={c.id} className="flex items-center gap-4 py-2 relative">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 z-10"
                      style={{ backgroundColor: color, boxShadow: i === 0 ? `0 0 8px ${color}60` : 'none' }}
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>
                        {isEntry ? 'Entered campus' : 'Left campus'}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--pms-text-muted)' }}>
                        {format(new Date(c.createdAt), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Alerts */}
        {recentAlerts.length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--pms-text-muted)' }}>
              Alerts
              {unreadAlerts > 0 && (
                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#EF44441A', color: '#EF4444' }}>
                  {unreadAlerts}
                </span>
              )}
            </p>
            {recentAlerts.slice(0, 4).map((a, i) => {
              const color = ALERT_COLORS[a.type] || '#A1A1AA'
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 py-2.5"
                  style={{
                    borderBottom: i < Math.min(recentAlerts.length, 4) - 1 ? '1px solid var(--pms-border)' : 'none',
                    opacity: a.isRead ? 0.45 : 1,
                  }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <p className="text-xs flex-1 min-w-0 truncate" style={{ color: 'var(--pms-text-sec)' }}>
                    {a.message}
                  </p>
                  <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--pms-text-muted)' }}>
                    {format(new Date(a.createdAt), 'MMM d')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
