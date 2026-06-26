'use client'

import {
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

// --- Attendance Donut ---
export function AttendanceDonut({ percent }: { percent: number }) {
  const data = [
    { name: 'Present', value: percent },
    { name: 'Absent', value: 100 - percent },
  ]
  const good = percent >= 75
  const colors = [good ? '#22C55E' : '#EF4444', '#27272A']
  return (
    <div className="relative" style={{ width: 64, height: 64 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={22}
            outerRadius={30}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: good ? '#22C55E' : '#EF4444' }}>
        {percent}%
      </span>
    </div>
  )
}

// --- Fee Mini Bar ---
export function FeeMiniBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? (paid / total) * 100 : 100
  const allPaid = total > 0 && paid >= total
  return (
    <div style={{ width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#27272A' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: allPaid ? '#22C55E' : '#A1A1AA',
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

// --- Score Sparkline ---
export function ScoreSparkline({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return null
  return (
    <div style={{ width: 80, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A1A1AA" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#A1A1AA" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#A1A1AA"
            strokeWidth={1.5}
            fill="url(#sparkGrad)"
            dot={false}
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- Attendance Trend Area Chart ---
export function AttendanceTrendChart({ data }: { data: { date: string; rate: number }[] }) {
  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#52525B', fontSize: 10 }}
            axisLine={{ stroke: '#27272A' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#52525B', fontSize: 10 }}
            axisLine={{ stroke: '#27272A' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              borderRadius: 8,
              color: '#FAFAFA',
              fontSize: 12,
            }}
            formatter={(value: unknown) => [`${value}%`, 'Attendance']}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#22C55E"
            strokeWidth={2}
            fill="url(#attendGrad)"
            dot={false}
            activeDot={{ r: 3, fill: '#22C55E', stroke: '#09090B', strokeWidth: 2 }}
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- Subject Performance Horizontal Bar Chart ---
export function SubjectPerformanceChart({ data }: { data: { subject: string; score: number }[] }) {
  return (
    <div style={{ width: '100%', height: Math.max(140, data.length * 36 + 20) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: '#52525B', fontSize: 10 }}
            axisLine={{ stroke: '#27272A' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="subject"
            tick={{ fill: '#71717A', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              borderRadius: 8,
              color: '#FAFAFA',
              fontSize: 12,
            }}
            formatter={(value: unknown) => [`${value}%`, 'Score']}
          />
          <Bar
            dataKey="score"
            radius={[0, 4, 4, 0]}
            barSize={14}
            fill="#A1A1AA"
            animationDuration={400}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
