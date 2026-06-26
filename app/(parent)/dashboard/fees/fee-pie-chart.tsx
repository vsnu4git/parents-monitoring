'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export function FeePieChart({ paid, pending, overdue }: { paid: number; pending: number; overdue: number }) {
  const data = [
    { name: 'Paid', value: paid },
    { name: 'Pending', value: pending },
    { name: 'Overdue', value: overdue },
  ].filter(d => d.value > 0)

  const COLORS = ['#22C55E', '#F59E0B', '#EF4444']

  if (data.length === 0) return null

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2 text-center" style={{ color: 'var(--pms-text-muted)' }}>Fee Breakdown</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', borderRadius: '8px', color: 'var(--pms-text)', fontSize: '12px' }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-[10px]" style={{ color: 'var(--pms-text-sec)' }}>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
