'use client'

import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell,
  PieChart, Pie,
  AreaChart, Area,
} from 'recharts'

const TYPE_LABELS: Record<string, string> = {
  INTERNAL_1: 'Internal 1', INTERNAL_2: 'Internal 2', INTERNAL_3: 'Internal 3',
  MODEL_EXAM: 'Model Exam', SEMESTER_EXAM: 'Semester', ASSIGNMENT: 'Assignment',
  QUIZ: 'Quiz', LAB: 'Lab',
}
const TYPE_SHORT: Record<string, string> = {
  INTERNAL_1: 'I1', INTERNAL_2: 'I2', INTERNAL_3: 'I3',
  MODEL_EXAM: 'ME', SEMESTER_EXAM: 'SE', ASSIGNMENT: 'AS',
  QUIZ: 'QZ', LAB: 'LB',
}

function grade(p: number) {
  if (p >= 90) return { g: 'O', c: '#22C55E' }
  if (p >= 80) return { g: 'A+', c: 'var(--pms-text)' }
  if (p >= 70) return { g: 'A', c: 'var(--pms-text-sec)' }
  if (p >= 60) return { g: 'B+', c: '#A1A1AA' }
  if (p >= 50) return { g: 'B', c: '#F59E0B' }
  return { g: 'C', c: '#EF4444' }
}
function scoreColor(p: number) { return p >= 70 ? '#22C55E' : p >= 50 ? '#A1A1AA' : '#EF4444' }

type Assessment = { id: string; type: string; score: number; maxScore: number; pct: number }
type SubjectResult = { name: string; code: string; avg: number; assessments: Assessment[] }

export default function AcademicsClient({
  studentName, registerNumber, subjectResults, overallAvg, totalSubjects, totalAssessments, topScore,
}: {
  studentName: string; registerNumber: string; subjectResults: SubjectResult[]
  overallAvg: number; totalSubjects: number; totalAssessments: number; topScore: number
}) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

  const g = grade(overallAvg)
  const best = subjectResults.reduce((b, s) => s.avg > b.avg ? s : b, subjectResults[0])
  const worst = subjectResults.reduce((w, s) => s.avg < w.avg ? s : w, subjectResults[0])

  const radarData = subjectResults.map(s => ({ subject: `${s.code} (${s.avg}%)`, score: s.avg, fullMark: 100 }))
  const ranked = [...subjectResults].sort((a, b) => b.avg - a.avg)
  const donut = [{ value: overallAvg, fill: g.c }, { value: 100 - overallAvg, fill: 'var(--pms-border)' }]

  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>

      {/* Header */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: 'var(--pms-text-muted)' }}>
          Academics
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>
          {studentName} · {registerNumber}
        </p>

        <div className="flex items-end justify-between mt-5">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-black leading-none" style={{ color: g.c }}>
                {overallAvg}
              </span>
              <span className="text-xl font-bold mb-1" style={{ color: 'var(--pms-text-muted)' }}>%</span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--pms-text-muted)' }}>
              Overall Average · Grade {g.g}
            </p>
          </div>
          <div className="relative" style={{ width: 64, height: 64 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donut} cx="50%" cy="50%" innerRadius={22} outerRadius={30} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  {donut.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-black" style={{ color: g.c }}>{g.g}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
            <span className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Best: {best?.code} ({best?.avg}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            <span className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>Needs work: {worst?.code} ({worst?.avg}%)</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">

        {/* Stat Pills */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-2xl py-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-lg font-black" style={{ color: 'var(--pms-text)' }}>{totalSubjects}</p>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Subjects</p>
          </div>
          <div className="flex-1 rounded-2xl py-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-lg font-black" style={{ color: 'var(--pms-text)' }}>{totalAssessments}</p>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Tests</p>
          </div>
          <div className="flex-1 rounded-2xl py-3 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-lg font-black" style={{ color: '#22C55E' }}>{topScore}%</p>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>Peak</p>
          </div>
        </div>

        {/* Radar */}
        {radarData.length > 2 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--pms-text-muted)' }}>
              Performance Map
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid stroke="var(--pms-border)" gridType="polygon" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#A1A1AA', fontSize: 9, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: '#A1A1AA', fontSize: 8 }}
                  tickCount={5}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}`}
                />
                <Radar
                  dataKey="score" stroke="var(--pms-brown)" fill="var(--pms-brown)"
                  fillOpacity={0.15} strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--pms-brown)', strokeWidth: 2, stroke: 'var(--pms-card)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Subject Ranking */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pms-text-muted)' }}>
              Ranking
            </p>
          </div>
          {ranked.map((s, i) => {
            const sg = grade(s.avg)
            const isExpanded = expandedSubject === s.code
            const sparkData = s.assessments.map((a, j) => ({ j, v: a.pct }))
            const barWidth = `${s.avg}%`

            return (
              <div key={s.code}>
                <button
                  className="w-full text-left px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-all duration-150"
                  onClick={() => setExpandedSubject(isExpanded ? null : s.code)}
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--pms-border)' }}
                >
                  <span
                    className="text-lg font-black w-7 text-center flex-shrink-0"
                    style={{ color: i === 0 ? 'var(--pms-text)' : 'var(--pms-text-muted)' }}
                  >
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--pms-text)' }}>{s.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pms-border)' }}>
                        <div className="h-full rounded-full transition-all duration-150" style={{ width: barWidth, backgroundColor: sg.c }} />
                      </div>
                      <span className="text-xs font-bold flex-shrink-0 w-10 text-right" style={{ color: sg.c }}>{s.avg}%</span>
                    </div>
                  </div>

                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)' }}
                  >
                    <span className="text-xs font-black" style={{ color: sg.c }}>{sg.g}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    {sparkData.length > 1 && (
                      <div className="mb-3 rounded-xl p-3" style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)' }}>
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--pms-text-muted)' }}>Trend</p>
                        <div style={{ height: 60 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                              <defs>
                                <linearGradient id={`grad-${s.code}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={sg.c} stopOpacity={0.3} />
                                  <stop offset="100%" stopColor={sg.c} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone" dataKey="v"
                                stroke={sg.c} fill={`url(#grad-${s.code})`}
                                strokeWidth={2}
                                dot={{ r: 3, fill: sg.c, strokeWidth: 0 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)' }}>
                      {s.assessments.map((a, ai) => {
                        const ac = scoreColor(a.pct)
                        return (
                          <div
                            key={a.id}
                            className="flex items-center px-3 py-2.5"
                            style={{ borderBottom: ai < s.assessments.length - 1 ? '1px solid var(--pms-border)' : 'none' }}
                          >
                            <span className="text-[9px] font-black w-6 text-center flex-shrink-0" style={{ color: 'var(--pms-text-muted)' }}>
                              {TYPE_SHORT[a.type] || '??'}
                            </span>
                            <div className="flex-1 mx-3">
                              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pms-border)' }}>
                                <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: ac }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] font-mono" style={{ color: 'var(--pms-text-muted)' }}>
                                {a.score}/{a.maxScore}
                              </span>
                              <span className="text-[10px] font-bold w-9 text-right" style={{ color: ac }}>
                                {a.pct}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.assessments.map(a => (
                        <span key={a.id} className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--pms-border)', color: 'var(--pms-text-muted)' }}>
                          {TYPE_SHORT[a.type]} = {TYPE_LABELS[a.type] || a.type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Comparison Bars */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--pms-text-muted)' }}>
            Head to Head
          </p>
          <ResponsiveContainer width="100%" height={subjectResults.length * 36 + 8}>
            <BarChart
              data={subjectResults.map(s => ({ name: s.code, avg: s.avg }))}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category" dataKey="name" width={38}
                tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 700 }}
                axisLine={false} tickLine={false}
              />
              <Bar dataKey="avg" radius={[0, 8, 8, 0]} barSize={14} background={{ fill: 'var(--pms-border)' }}>
                {subjectResults.map((s, i) => <Cell key={i} fill={grade(s.avg).c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
