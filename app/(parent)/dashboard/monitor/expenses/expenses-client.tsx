'use client'

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#A1A1AA',
  STATIONERY: '#71717A',
  PRINTING: '#D4D4D8',
  EVENT: '#52525B',
  TRANSPORT: '#E4E4E7',
  OTHER: '#3F3F46',
}

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: '\uD83C\uDF7D\uFE0F',
  STATIONERY: '\uD83D\uDCDD',
  PRINTING: '\uD83D\uDDA8\uFE0F',
  EVENT: '\uD83C\uDFAA',
  TRANSPORT: '\uD83D\uDE8C',
  OTHER: '\uD83D\uDCE6',
}

type Transaction = {
  id: string
  category: string
  vendor: string
  description: string
  amount: number
  transactionAt: string
}

type Props = {
  studentName: string
  balance: number
  isConnected: boolean
  todaySpend: number
  weekTotal: number
  dailySpend: { day: string; amount: number }[]
  categoryData: { category: string; amount: number }[]
  transactions: Transaction[]
}

export default function ExpensesClient({
  studentName,
  balance,
  isConnected,
  todaySpend,
  weekTotal,
  dailySpend,
  categoryData,
  transactions,
}: Props) {
  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>CampusOne Expenses</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>{studentName} - Campus spending overview</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Balance</p>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isConnected ? '#22C55E' : '#EF4444' }} />
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--pms-text)' }}>
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--pms-text-muted)' }}>Today</p>
          <p className="text-lg font-bold" style={{ color: 'var(--pms-text)' }}>
            ₹{todaySpend.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--pms-text-muted)' }}>Week</p>
          <p className="text-lg font-bold" style={{ color: 'var(--pms-text)' }}>
            ₹{weekTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-3 mb-4">
        {/* Weekly Bar Chart */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Daily Spending (This Week)</h2>
          {dailySpend.every((d) => d.amount === 0) ? (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--pms-text-muted)' }}>
              No spending data this week
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailySpend} barSize={28}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', borderRadius: '8px', color: 'var(--pms-text)' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spent']}
                />
                <Bar dataKey="amount" fill="#A1A1AA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Category Breakdown</h2>
          {categoryData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--pms-text-muted)' }}>
              No category data
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={75} innerRadius={42} strokeWidth={0}>
                    {categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={CATEGORY_COLORS[entry.category] || '#3F3F46'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', borderRadius: '8px', color: 'var(--pms-text)' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.map((entry) => (
                  <div key={entry.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS[entry.category] || '#3F3F46' }} />
                      <span className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>
                        {CATEGORY_ICONS[entry.category] || ''} {entry.category}
                      </span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--pms-text)' }}>
                      ₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--pms-text)' }}>Transaction History</h2>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: 'var(--pms-text-muted)' }}>
              No transactions found
            </div>
          ) : (
            <div>
              {transactions.map((t, i) => (
                <div key={t.id} className="p-4 flex items-center gap-3" style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--pms-border)' : 'none' }}>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${CATEGORY_COLORS[t.category] || '#3F3F46'}1A` }}
                  >
                    {CATEGORY_ICONS[t.category] || '\uD83D\uDCE6'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--pms-text)' }}>{t.vendor}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--pms-text-muted)' }}>{t.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#EF4444]">
                      -₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{t.transactionAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
