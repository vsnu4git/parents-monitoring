'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface TicketChartProps {
  open: number
  inProgress: number
  resolved: number
  closed: number
}

interface FeeChartProps {
  paid: number
  pending: number
  overdue: number
}

export function TicketPieChart({ open, inProgress, resolved, closed }: TicketChartProps) {
  const data = [
    { name: 'Open', value: open },
    { name: 'In Progress', value: inProgress },
    { name: 'Resolved', value: resolved },
    { name: 'Closed', value: closed },
  ].filter(d => d.value > 0)

  const COLORS = ['#FB923C', '#60A5FA', '#4ADE80', '#52525B']

  if (data.length === 0) {
    return (
      <div className="rounded-2xl p-4" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
        <p className="text-[10px] uppercase tracking-wide mb-2 text-center" style={{ color: '#71717A' }}>Ticket Status</p>
        <p className="text-center py-8 text-sm" style={{ color: '#52525B' }}>No ticket data</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
      <p className="text-[10px] uppercase tracking-wide mb-2 text-center" style={{ color: '#71717A' }}>Ticket Status</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px', color: '#FAFAFA', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-[10px]" style={{ color: '#A1A1AA' }}>{d.name}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FeeBarChart({ paid, pending, overdue }: FeeChartProps) {
  const data = [
    { name: 'Paid', value: paid, fill: '#4ADE80' },
    { name: 'Pending', value: pending, fill: '#FB923C' },
    { name: 'Overdue', value: overdue, fill: '#EF4444' },
  ]

  const total = paid + pending + overdue
  if (total === 0) {
    return (
      <div className="rounded-2xl p-4" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
        <p className="text-[10px] uppercase tracking-wide mb-2 text-center" style={{ color: '#71717A' }}>Fee Overview</p>
        <p className="text-center py-8 text-sm" style={{ color: '#52525B' }}>No fee data</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
      <p className="text-[10px] uppercase tracking-wide mb-2 text-center" style={{ color: '#71717A' }}>Fee Overview</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
          <XAxis dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px', color: '#FAFAFA', fontSize: '12px' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
