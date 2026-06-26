'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

type MarkData = {
  subject: string
  score: number
  maxScore: number
  type: string
}

type DailyAtt = {
  day: string
  present: number
  absent: number
}

type StudentData = {
  name: string
  registerNumber: string
  department: { name: string; code: string }
}

type Props = {
  data: {
    student: StudentData
    attPct: number
    total: number
    present: number
    totalSpent: number
    totalFoodSpent: number
    mealsLogged: number
    avgMealsPerDay: string
    totalDue: number
    pendingFees: number
    checkIns: number
    odTrips: number
    marks: MarkData[]
    dailyAtt: DailyAtt[]
  }
}

export function ReportClient({ data }: Props) {
  const {
    student, attPct, total, present, totalSpent, totalFoodSpent,
    mealsLogged, avgMealsPerDay, totalDue, pendingFees,
    checkIns, odTrips, marks, dailyAtt,
  } = data

  const weekEnd = new Date()
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  function formatShortDate(d: Date) {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  function generateSummary() {
    const parts: string[] = []

    if (total > 0) {
      if (attPct >= 85) parts.push(`Attendance is strong at ${attPct}% (${present}/${total} classes).`)
      else if (attPct >= 75) parts.push(`Attendance is at ${attPct}% (${present}/${total} classes) - needs improvement.`)
      else parts.push(`Attendance is concerning at ${attPct}% (${present}/${total} classes) - immediate attention needed.`)
    } else {
      parts.push('No attendance records this week.')
    }

    if (totalSpent > 0) parts.push(`Total campus spending was Rs.${totalSpent.toLocaleString('en-IN')}.`)
    if (mealsLogged > 0) parts.push(`${mealsLogged} meals logged, averaging ${avgMealsPerDay} per day.`)
    if (totalDue > 0) parts.push(`Rs.${totalDue.toLocaleString('en-IN')} in fees pending across ${pendingFees} records.`)
    if (checkIns > 0) parts.push(`${checkIns} campus check-ins recorded.`)
    if (odTrips > 0) parts.push(`${odTrips} OD trip(s) this week.`)
    if (marks.length > 0) parts.push(`${marks.length} assessment result(s) published.`)

    return parts.join(' ')
  }

  const reportCards = [
    { label: 'Attendance', value: `${attPct}%`, sub: `${present}/${total} classes`, color: attPct >= 75 ? '#22C55E' : '#EF4444' },
    { label: 'Spending', value: `Rs.${totalSpent.toLocaleString('en-IN')}`, sub: `Food: Rs.${totalFoodSpent.toLocaleString('en-IN')}`, color: 'var(--pms-brown)' },
    { label: 'Meals/Day', value: avgMealsPerDay, sub: `${mealsLogged} total`, color: 'var(--pms-brown)' },
    { label: 'Fees Due', value: `Rs.${totalDue.toLocaleString('en-IN')}`, sub: `${pendingFees} pending`, color: totalDue > 0 ? '#EF4444' : '#22C55E' },
    { label: 'Check-ins', value: `${checkIns}`, sub: 'this week', color: 'var(--pms-brown)' },
    { label: 'OD Trips', value: `${odTrips}`, sub: 'this week', color: 'var(--pms-brown)' },
  ]

  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Weekly Report</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>
            {formatShortDate(weekStart)} - {formatShortDate(weekEnd)}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
            {student.name} | {student.registerNumber} | {student.department.name}
          </p>
        </div>

        {/* Report Card Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {reportCards.map((card, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--pms-text-muted)' }}>{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--pms-text-muted)' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Daily Attendance Chart */}
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Daily Attendance</h2>
          {dailyAtt.some(d => d.present + d.absent > 0) ? (
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyAtt} barSize={24}>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#A1A1AA', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#A1A1AA', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Bar dataKey="present" stackId="a" radius={[0, 0, 0, 0]}>
                    {dailyAtt.map((_, index) => (
                      <Cell key={index} fill="#A1A1AA" />
                    ))}
                  </Bar>
                  <Bar dataKey="absent" stackId="a" radius={[4, 4, 0, 0]}>
                    {dailyAtt.map((_, index) => (
                      <Cell key={index} fill="var(--pms-border)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-center py-5" style={{ color: 'var(--pms-text-muted)' }}>No attendance data this week.</p>
          )}
          <div className="flex gap-5 mt-3 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#A1A1AA]" />
              <span className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--pms-border)' }} />
              <span className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Absent</span>
            </div>
          </div>
        </div>

        {/* Marks Published */}
        {marks.length > 0 && (
          <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Marks Published This Week</h2>
            <div className="space-y-2">
              {marks.map((m, i) => {
                const pct = m.maxScore > 0 ? Math.round((m.score / m.maxScore) * 100) : 0
                return (
                  <div key={i} className="flex justify-between items-center rounded-xl p-3" style={{ backgroundColor: 'var(--pms-bg)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{m.subject}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>{m.type.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: pct >= 60 ? 'var(--pms-brown)' : '#EF4444' }}>
                        {m.score}/{m.maxScore}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--pms-text-muted)' }}>{pct}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--pms-text)' }}>Week Summary</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--pms-text-sec)' }}>
            {generateSummary()}
          </p>
        </div>
      </div>
    </div>
  )
}
