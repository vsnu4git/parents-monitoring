'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Brain, Shield, Sparkles } from 'lucide-react'

interface InsightItem {
  type: 'warning' | 'danger' | 'positive' | 'info'
  icon: string
  title: string
  detail: string
}

interface InsightsData {
  student: { name: string; registerNumber: string; department: { code: string } }
  insights: InsightItem[]
  trustScore: number
  trustLevel: string
  weekComparison: {
    attendance: { thisWeek: number; lastWeek: number }
    meals: { thisWeek: number; lastWeek: number }
    spending: { thisWeek: number; lastWeek: number }
    checkIns: { thisWeek: number; lastWeek: number }
  }
  dangerCount: number
  warningCount: number
  positiveCount: number
}

const TYPE_STYLES: Record<string, { bg: string; border: string }> = {
  danger: { bg: '#EF44440D', border: '#EF444430' },
  warning: { bg: '#F59E0B0D', border: '#F59E0B30' },
  positive: { bg: '#22C55E0D', border: '#22C55E30' },
  info: { bg: 'var(--pms-card)', border: 'var(--pms-border)' },
}

function TrustScoreRing({ score, level }: { score: number; level: string }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? 'var(--pms-brown)' : score >= 40 ? '#F59E0B' : '#EF4444'
  const donut = [{ value: score, fill: color }, { value: 100 - score, fill: 'var(--pms-border)' }]

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={donut} cx="50%" cy="50%" innerRadius={50} outerRadius={65} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
              {donut.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{score}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Trust</span>
        </div>
      </div>
      <p className="text-sm font-bold mt-2" style={{ color }}>{level}</p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
        {score >= 80 ? 'Maximum autonomy earned' : score >= 60 ? 'Good standing' : score >= 40 ? 'Some concerns detected' : 'Close monitoring recommended'}
      </p>
    </div>
  )
}

function ComparisonPill({ label, thisWeek, lastWeek, format: fmt }: { label: string; thisWeek: number; lastWeek: number; format?: 'pct' | 'currency' | 'count' }) {
  const diff = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0
  const isUp = diff > 0
  const isDown = diff < 0
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

  const formatVal = (v: number) => {
    if (fmt === 'pct') return v >= 0 ? `${v}%` : '—'
    if (fmt === 'currency') return `₹${v}`
    return `${v}`
  }

  return (
    <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>{label}</span>
        {diff !== 0 && (
          <div className="flex items-center gap-0.5">
            <Icon className="w-3 h-3" style={{ color: label === 'Spending' ? (isUp ? '#EF4444' : '#22C55E') : (isUp ? '#22C55E' : '#EF4444') }} />
            <span className="text-[9px] font-bold" style={{ color: label === 'Spending' ? (isUp ? '#EF4444' : '#22C55E') : (isUp ? '#22C55E' : '#EF4444') }}>
              {Math.abs(diff)}%
            </span>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black" style={{ color: 'var(--pms-text)' }}>{formatVal(thisWeek)}</span>
        <span className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>vs {formatVal(lastWeek)}</span>
      </div>
    </div>
  )
}

export function InsightsClient({ data }: { data: InsightsData }) {
  const { student, insights, trustScore, trustLevel, weekComparison, dangerCount, warningCount, positiveCount } = data

  const dangers = insights.filter(i => i.type === 'danger')
  const warnings = insights.filter(i => i.type === 'warning')
  const positives = insights.filter(i => i.type === 'positive')
  const infos = insights.filter(i => i.type === 'info')

  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5" style={{ color: 'var(--pms-brown)' }} />
          <span className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: 'var(--pms-text-muted)' }}>
            Insight Engine
          </span>
        </div>
        <p className="text-xl font-black" style={{ color: 'var(--pms-text)' }}>
          Weekly Intelligence
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
          {student.name} · {student.department.code} · Auto-analyzed behavioral patterns
        </p>

        <div className="flex gap-2 mt-4">
          {dangerCount > 0 && (
            <span className="text-[9px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#EF44441A', color: '#EF4444', border: '1px solid #EF444430' }}>
              {dangerCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[9px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F59E0B1A', color: '#F59E0B', border: '1px solid #F59E0B30' }}>
              {warningCount} warning{warningCount > 1 ? 's' : ''}
            </span>
          )}
          {positiveCount > 0 && (
            <span className="text-[9px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#22C55E1A', color: '#22C55E', border: '1px solid #22C55E30' }}>
              {positiveCount} positive
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">

        {/* Trust Score */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4" style={{ color: 'var(--pms-brown)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Trust Score</span>
          </div>
          <TrustScoreRing score={trustScore} level={trustLevel} />
        </div>

        {/* Week vs Week */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--pms-brown)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>This Week vs Last</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ComparisonPill label="Attendance" thisWeek={weekComparison.attendance.thisWeek} lastWeek={weekComparison.attendance.lastWeek} format="pct" />
            <ComparisonPill label="Meals" thisWeek={weekComparison.meals.thisWeek} lastWeek={weekComparison.meals.lastWeek} format="count" />
            <ComparisonPill label="Spending" thisWeek={weekComparison.spending.thisWeek} lastWeek={weekComparison.spending.lastWeek} format="currency" />
            <ComparisonPill label="Check-ins" thisWeek={weekComparison.checkIns.thisWeek} lastWeek={weekComparison.checkIns.lastWeek} format="count" />
          </div>
        </div>

        {/* Critical */}
        {dangers.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#EF4444' }}>
              Needs Immediate Attention
            </p>
            <div className="space-y-2">
              {dangers.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#F59E0B' }}>
              Watch Out
            </p>
            <div className="space-y-2">
              {warnings.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Positive */}
        {positives.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#22C55E' }}>
              Going Well
            </p>
            <div className="space-y-2">
              {positives.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        {infos.length > 0 && (
          <div className="space-y-2">
            {infos.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        )}

        {/* How Trust Score Works */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--pms-text-muted)' }}>
            How Trust Score Works
          </p>
          <div className="space-y-2">
            {[
              { label: 'Attendance above 85%', effect: '+15', color: '#22C55E' },
              { label: 'No missed OD destinations', effect: '+10', color: '#22C55E' },
              { label: 'Regular check-ins', effect: '+10', color: '#22C55E' },
              { label: 'Proper meal habits', effect: '+5', color: '#22C55E' },
              { label: 'No overdue fees', effect: '+5', color: '#22C55E' },
              { label: 'Missed OD destination', effect: '-15', color: '#EF4444' },
              { label: 'Attendance below 75%', effect: '-10', color: '#EF4444' },
              { label: 'Frequent missed check-ins', effect: '-10', color: '#EF4444' },
            ].map((rule, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-[11px]" style={{ color: 'var(--pms-text-sec)' }}>{rule.label}</span>
                <span className="text-[11px] font-bold font-mono" style={{ color: rule.color }}>{rule.effect}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] mt-3 pt-2" style={{ color: 'var(--pms-text-muted)', borderTop: '1px solid var(--pms-border)' }}>
            Higher trust score = more autonomy for the student. Score updates weekly based on behavior patterns.
          </p>
        </div>
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: InsightItem }) {
  const style = TYPE_STYLES[insight.type]
  return (
    <div
      className="rounded-2xl p-4 flex gap-3"
      style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{insight.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: 'var(--pms-text)' }}>{insight.title}</p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--pms-text-sec)' }}>{insight.detail}</p>
      </div>
    </div>
  )
}
