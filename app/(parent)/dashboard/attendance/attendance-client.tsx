'use client'

import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = {
  present: '#22C55E',
  absent: '#EF4444',
  od: '#A1A1AA',
  leave: '#F59E0B'
}

const statusColors: Record<string, { dot: string; text: string; label: string }> = {
  PRESENT: { dot: '#22C55E', text: '#22C55E', label: 'Present' },
  ABSENT: { dot: '#EF4444', text: '#EF4444', label: 'Absent' },
  OD: { dot: '#A1A1AA', text: '#A1A1AA', label: 'OD' },
  LEAVE: { dot: '#F59E0B', text: '#F59E0B', label: 'Leave' }
}

type SubjectStat = {
  id: string; name: string; code: string
  total: number; present: number; absent: number; od: number; leave: number; percentage: number
}

type TrendPoint = { date: string; pct: number }
type RecentRecord = { id: string; subjectName: string; date: string; status: string }

export default function AttendanceClient({
  studentName,
  registerNumber,
  overallPct,
  totalClasses,
  totalPresent,
  totalAbsent,
  totalOD,
  totalLeave,
  subjectStats,
  trendData,
  recentRecords,
  classesNeeded
}: {
  studentName: string
  registerNumber: string
  overallPct: number
  totalClasses: number
  totalPresent: number
  totalAbsent: number
  totalOD: number
  totalLeave: number
  subjectStats: SubjectStat[]
  trendData: TrendPoint[]
  recentRecords: RecentRecord[]
  classesNeeded: number
}) {
  const donutData = [
    { name: 'Present', value: totalPresent, color: COLORS.present },
    { name: 'Absent', value: totalAbsent, color: COLORS.absent },
    { name: 'OD', value: totalOD, color: COLORS.od },
    { name: 'Leave', value: totalLeave, color: COLORS.leave }
  ].filter(d => d.value > 0)

  const subjectBarData = subjectStats.map(s => ({
    name: s.code,
    Present: s.present,
    Absent: s.absent,
    OD: s.od,
    Leave: s.leave
  }))

  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Attendance</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>{studentName} &middot; {registerNumber}</p>
      </div>

      {/* Big Donut Chart */}
      <div className="mb-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-center mb-2" style={{ color: 'var(--pms-text-muted)' }}>Overall Attendance</p>
          <div className="relative" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', borderRadius: 12, color: 'var(--pms-text)' }}
                  labelStyle={{ color: 'var(--pms-text-sec)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold" style={{ color: overallPct < 75 ? '#EF4444' : '#22C55E' }}>
                {overallPct}%
              </span>
              <span className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>{totalPresent + totalOD} / {totalClasses}</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px]" style={{ color: 'var(--pms-text-sec)' }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warning card below 75% */}
      {overallPct < 75 && (
        <div className="mb-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#EF44441A', border: '1px solid #EF444440' }}>
            <p className="text-sm font-medium text-center" style={{ color: '#EF4444' }}>
              Below 75% minimum requirement
            </p>
            {totalClasses > 0 && classesNeeded > 0 && (
              <p className="text-xs text-center mt-1" style={{ color: 'var(--pms-text-sec)' }}>
                Need {classesNeeded} more consecutive classes to reach 75%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Attendance Trend */}
      {trendData.length > 0 && (
        <div className="mb-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--pms-text-muted)' }}>Daily Trend</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--pms-brown)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--pms-brown)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#A1A1AA', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#A1A1AA', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', borderRadius: 12, color: 'var(--pms-text)' }}
                  labelStyle={{ color: 'var(--pms-text-sec)' }}
                  formatter={(value) => [`${value}%`, 'Attendance']}
                />
                <Area
                  type="monotone"
                  dataKey="pct"
                  stroke="var(--pms-brown)"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subject Breakdown */}
      {subjectBarData.length > 0 && (
        <div className="mb-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--pms-text-muted)' }}>By Subject</h2>
            <ResponsiveContainer width="100%" height={subjectBarData.length * 44 + 40}>
              <BarChart data={subjectBarData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={55}
                  tick={{ fill: '#A1A1AA', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', borderRadius: 12, color: 'var(--pms-text)' }}
                  labelStyle={{ color: 'var(--pms-text-sec)' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#A1A1AA' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="Present" stackId="a" fill={COLORS.present} radius={[0, 0, 0, 0]} barSize={18} />
                <Bar dataKey="Absent" stackId="a" fill={COLORS.absent} />
                <Bar dataKey="OD" stackId="a" fill={COLORS.od} />
                <Bar dataKey="Leave" stackId="a" fill={COLORS.leave} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Log */}
      {recentRecords.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--pms-text-muted)' }}>Recent Log</h2>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            {recentRecords.map((r, i) => {
              const style = statusColors[r.status] || { dot: '#A1A1AA', text: '#A1A1AA', label: r.status }
              return (
                <div key={r.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < recentRecords.length - 1 ? '1px solid var(--pms-border)' : 'none' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--pms-text)' }}>{r.subjectName}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>{r.date}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dot }} />
                    <span className="text-xs font-medium" style={{ color: style.text }}>{style.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
