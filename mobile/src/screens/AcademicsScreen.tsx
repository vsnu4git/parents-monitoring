import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native'
import Svg, {
  Circle,
  Path,
  Line,
  Polygon,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg'
import { useQuery } from '@tanstack/react-query'
import { getProfile, getAttendance, getMarks } from '../api/endpoints'
import { StudentSelector } from '../components/StudentSelector'
import { Card } from '../components/Card'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import { formatPercentage } from '../utils/format'
import Animated, { FadeInDown } from 'react-native-reanimated'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// ── Constants ──────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  INTERNAL_1: 'Internal 1',
  INTERNAL_2: 'Internal 2',
  INTERNAL_3: 'Internal 3',
  MODEL_EXAM: 'Model Exam',
  SEMESTER_EXAM: 'Semester',
  ASSIGNMENT: 'Assignment',
  QUIZ: 'Quiz',
  LAB: 'Lab',
}
const TYPE_SHORT: Record<string, string> = {
  INTERNAL_1: 'I1',
  INTERNAL_2: 'I2',
  INTERNAL_3: 'I3',
  MODEL_EXAM: 'ME',
  SEMESTER_EXAM: 'SE',
  ASSIGNMENT: 'AS',
  QUIZ: 'QZ',
  LAB: 'LB',
}

function gradeInfo(p: number) {
  if (p >= 90) return { g: 'O', color: '#4CAF50', bg: '#0F1A0F', bd: '#1A2E1A' }
  if (p >= 80) return { g: 'A+', color: '#E4E4E7', bg: '#1A1508', bd: '#2A2518' }
  if (p >= 70) return { g: 'A', color: '#FAFAFA', bg: '#1A1508', bd: '#2A2015' }
  if (p >= 60) return { g: 'B+', color: '#A1A1AA', bg: '#15120A', bd: '#2A2010' }
  if (p >= 50) return { g: 'B', color: '#FF9800', bg: '#1A1208', bd: '#2A1F10' }
  return { g: 'C', color: '#E53935', bg: '#1A0E0E', bd: '#2E1A1A' }
}

function gradeInfoThemed(p: number, isDark: boolean) {
  if (isDark) return gradeInfo(p)
  if (p >= 90) return { g: 'O', color: '#2E7D32', bg: '#E8F5E9', bd: '#A5D6A7' }
  if (p >= 80) return { g: 'A+', color: '#A1A1AA', bg: '#FFF8E1', bd: '#FFE082' }
  if (p >= 70) return { g: 'A', color: '#18181B', bg: '#FFF3E0', bd: '#FFCC80' }
  if (p >= 60) return { g: 'B+', color: '#E65100', bg: '#FFF3E0', bd: '#FFB74D' }
  if (p >= 50) return { g: 'B', color: '#F57C00', bg: '#FFF3E0', bd: '#FFB74D' }
  return { g: 'C', color: '#C62828', bg: '#FDEAEA', bd: '#EF9A9A' }
}

function scoreColor(p: number, isDark: boolean) {
  if (isDark) return p >= 70 ? '#4CAF50' : p >= 50 ? '#FAFAFA' : '#E53935'
  return p >= 70 ? '#2E7D32' : p >= 50 ? '#18181B' : '#C62828'
}

type Assessment = { id: string; type: string; score: number; maxScore: number; pct: number }
type SubjectResult = { name: string; code: string; avg: number; assessments: Assessment[] }

const SCREEN_WIDTH = Dimensions.get('window').width

// ── Animation helpers ───────────────────────────────────────
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function useAnimatedProgress(duration: number, delay: number = 0) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    let startTime: number | null = null
    rafRef.current = requestAnimationFrame(function step(ts) {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime - delay
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(step)
        return
      }
      const t = Math.min(elapsed / duration, 1)
      setProgress(easeOutCubic(t))
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(rafRef.current)
  }, [duration, delay])

  return progress
}

// ── SVG Charts ─────────────────────────────────────────────

/** Donut chart rendered with react-native-svg — animated sweep-in + count-up */
function DonutChart({
  percentage,
  color,
  label,
  size = 64,
  strokeWidth = 8,
  bgColor,
}: {
  percentage: number
  color: string
  label: string
  size?: number
  strokeWidth?: number
  bgColor: string
}) {
  const anim = useAnimatedProgress(800)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const animatedPct = percentage * anim
  const progress = (animatedPct / 100) * circumference
  const center = size / 2

  // Count-up: if label is purely numeric (like "82%"), animate the number
  const isNumericLabel = /^\d+%?$/.test(label)
  const displayLabel = isNumericLabel
    ? `${Math.round(parseFloat(label) * anim)}${label.includes('%') ? '%' : ''}`
    : label

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.22, fontWeight: '900', color }}>{displayLabel}</Text>
      </View>
    </View>
  )
}

/** Radar/Spider chart for subject performance — animated scale from center */
function RadarChart({
  data,
  color,
  width,
  height,
  labelColor,
  gridColor,
  bgFill,
}: {
  data: { label: string; value: number }[]
  color: string
  width: number
  height: number
  labelColor: string
  gridColor: string
  bgFill: string
}) {
  const anim = useAnimatedProgress(800)
  const cx = width / 2
  const cy = height / 2
  const maxR = Math.min(cx, cy) - 36
  const n = data.length
  if (n < 3) return null

  const angleSlice = (2 * Math.PI) / n

  function pointOnAxis(i: number, r: number) {
    const angle = angleSlice * i - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  // Grid levels
  const levels = [20, 40, 60, 80, 100]
  const gridPolygons = levels.map((lvl) => {
    const pts = data.map((_, i) => {
      const p = pointOnAxis(i, (lvl / 100) * maxR)
      return `${p.x},${p.y}`
    })
    return pts.join(' ')
  })

  // Data polygon — scale from center using animation progress
  const dataPoints = data.map((d, i) => {
    const p = pointOnAxis(i, (d.value / 100) * maxR * anim)
    return { x: p.x, y: p.y }
  })
  const dataPolygonStr = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  // Axis lines
  const axisLines = data.map((_, i) => {
    const p = pointOnAxis(i, maxR)
    return { x2: p.x, y2: p.y }
  })

  // Labels positioned outside
  const labelPositions = data.map((d, i) => {
    const p = pointOnAxis(i, maxR + 18)
    return { x: p.x, y: p.y, text: `${d.label} (${Math.round(d.value * anim)}%)` }
  })

  return (
    <Svg width={width} height={height}>
      {/* Grid polygons */}
      {gridPolygons.map((pts, i) => (
        <Polygon key={i} points={pts} fill="none" stroke={gridColor} strokeWidth={1} />
      ))}
      {/* Axis lines */}
      {axisLines.map((line, i) => (
        <Line key={i} x1={cx} y1={cy} x2={line.x2} y2={line.y2} stroke={gridColor} strokeWidth={0.5} />
      ))}
      {/* Data polygon with fill */}
      <Polygon
        points={dataPolygonStr}
        fill={color}
        fillOpacity={0.15 * anim}
        stroke={color}
        strokeWidth={2}
        strokeOpacity={anim}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4 * anim} fill={color} stroke={bgFill} strokeWidth={2} />
      ))}
      {/* Labels */}
      {labelPositions.map((lbl, i) => (
        <SvgText
          key={i}
          x={lbl.x}
          y={lbl.y}
          fill={labelColor}
          fontSize={8}
          fontWeight="600"
          textAnchor="middle"
          alignmentBaseline="central"
          opacity={anim}
        >
          {lbl.text}
        </SvgText>
      ))}
    </Svg>
  )
}

/** Horizontal bar chart for head-to-head comparison — animated staggered bars */
function HorizontalBarChart({
  data,
  width,
  labelColor,
  bgBarColor,
  isDark,
}: {
  data: { label: string; value: number }[]
  width: number
  labelColor: string
  bgBarColor: string
  isDark: boolean
}) {
  const barHeight = 14
  const rowHeight = 36
  const leftPad = 40
  const rightPad = 8
  const barAreaWidth = width - leftPad - rightPad
  const chartHeight = data.length * rowHeight + 8

  // Staggered animation: each bar gets a 40ms delay
  const totalDuration = 600
  const staggerDelay = 40
  const [progresses, setProgresses] = useState<number[]>(() => data.map(() => 0))
  const rafRef = useRef<number>(0)

  useEffect(() => {
    let startTime: number | null = null
    rafRef.current = requestAnimationFrame(function step(ts) {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime
      const newP = data.map((_, i) => {
        const itemElapsed = elapsed - i * staggerDelay
        if (itemElapsed <= 0) return 0
        const t = Math.min(itemElapsed / totalDuration, 1)
        return easeOutCubic(t)
      })
      setProgresses(newP)
      if (newP[newP.length - 1] < 1) rafRef.current = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(rafRef.current)
  }, [data.length])

  return (
    <Svg width={width} height={chartHeight}>
      {data.map((d, i) => {
        const y = i * rowHeight + 4
        const barW = (d.value / 100) * barAreaWidth * (progresses[i] || 0)
        const gi = gradeInfoThemed(d.value, isDark)
        return (
          <G key={i}>
            <SvgText
              x={leftPad - 6}
              y={y + barHeight / 2}
              fill={labelColor}
              fontSize={10}
              fontWeight="700"
              textAnchor="end"
              alignmentBaseline="central"
            >
              {d.label}
            </SvgText>
            <Rect
              x={leftPad}
              y={y}
              width={barAreaWidth}
              height={barHeight}
              rx={7}
              fill={bgBarColor}
            />
            <Rect
              x={leftPad}
              y={y}
              width={Math.max(barW, 2)}
              height={barHeight}
              rx={7}
              fill={gi.color}
            />
          </G>
        )
      })}
    </Svg>
  )
}

/** Sparkline area chart for assessment trend — animated draw left-to-right */
function SparklineChart({
  data,
  color,
  width,
  height,
  bgColor,
}: {
  data: number[]
  color: string
  width: number
  height: number
  bgColor: string
}) {
  const anim = useAnimatedProgress(500)

  if (data.length < 2) return null
  const pad = 8
  const w = width - pad * 2
  const h = height - pad * 2
  const minV = Math.min(...data) - 5
  const maxV = Math.max(...data) + 5
  const range = maxV - minV || 1

  const allPoints = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * w,
    y: pad + h - ((v - minV) / range) * h,
  }))

  // Clip points to the animated x position (draw left to right)
  const maxX = pad + anim * w
  const points: { x: number; y: number }[] = []
  for (let i = 0; i < allPoints.length; i++) {
    if (allPoints[i].x <= maxX) {
      points.push(allPoints[i])
    } else {
      // Interpolate a point at maxX between allPoints[i-1] and allPoints[i]
      if (i > 0) {
        const prev = allPoints[i - 1]
        const curr = allPoints[i]
        const fraction = (maxX - prev.x) / (curr.x - prev.x)
        points.push({ x: maxX, y: prev.y + fraction * (curr.y - prev.y) })
      }
      break
    }
  }

  if (points.length < 2) return <Svg width={width} height={height} />

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${pad + h} L ${points[0].x} ${pad + h} Z`

  const gradId = useRef(`spark-grad-${Math.random().toString(36).slice(2, 8)}`).current

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#${gradId})`} />
      <Path d={linePath} stroke={color} strokeWidth={2} fill="none" />
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
    </Svg>
  )
}

// ── Main Screen ────────────────────────────────────────────

export function AcademicsScreen() {
  const { c, spacing, isDark } = useTheme()
  const [tab, setTab] = useState<'attendance' | 'marks'>('marks')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

  // Hero count-up animation
  const heroAnim = useAnimatedProgress(800)

  // Ranking bars staggered animation
  const [rankBarProgresses, setRankBarProgresses] = useState<number[]>([])
  const rankBarRafRef = useRef<number>(0)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const studentId = selectedStudentId || profile?.students[0]?.id || ''

  const {
    data: attendance,
    isLoading: attLoading,
    refetch: refetchAtt,
  } = useQuery({
    queryKey: ['attendance', studentId],
    queryFn: () => getAttendance(studentId),
    enabled: !!studentId && tab === 'attendance',
  })

  const {
    data: marks,
    isLoading: marksLoading,
    refetch: refetchMarks,
  } = useQuery({
    queryKey: ['marks', studentId],
    queryFn: () => getMarks(studentId),
    enabled: !!studentId,
  })

  // ── Derived data ──
  const { subjectResults, overallAvg, totalSubjects, totalAssessments, topScore, ranked, best, worst } =
    useMemo(() => {
      if (!marks || marks.length === 0)
        return {
          subjectResults: [] as SubjectResult[],
          overallAvg: 0,
          totalSubjects: 0,
          totalAssessments: 0,
          topScore: 0,
          ranked: [] as SubjectResult[],
          best: null as SubjectResult | null,
          worst: null as SubjectResult | null,
        }

      const bySubject: Record<string, { name: string; code: string; assessments: typeof marks }> = {}
      for (const m of marks) {
        if (!bySubject[m.subjectId])
          bySubject[m.subjectId] = { name: m.subject.name, code: m.subject.code, assessments: [] }
        bySubject[m.subjectId].assessments.push(m)
      }

      const results: SubjectResult[] = Object.values(bySubject).map((s) => {
        const avg =
          s.assessments.length > 0
            ? s.assessments.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) /
              s.assessments.length
            : 0
        return {
          name: s.name,
          code: s.code,
          avg: Math.round(avg),
          assessments: s.assessments.map((a) => ({
            id: a.id,
            type: a.assessmentType,
            score: a.score,
            maxScore: a.maxScore,
            pct: Math.round((a.score / a.maxScore) * 100),
          })),
        }
      })

      const overall =
        results.length > 0
          ? Math.round(results.reduce((sum, s) => sum + s.avg, 0) / results.length)
          : 0
      const top =
        marks.length > 0 ? Math.round(Math.max(...marks.map((m) => (m.score / m.maxScore) * 100))) : 0
      const sortedRank = [...results].sort((a, b) => b.avg - a.avg)
      const bestSubj = results.reduce((b, s) => (s.avg > b.avg ? s : b), results[0])
      const worstSubj = results.reduce((w, s) => (s.avg < w.avg ? s : w), results[0])

      return {
        subjectResults: results,
        overallAvg: overall,
        totalSubjects: results.length,
        totalAssessments: marks.length,
        topScore: top,
        ranked: sortedRank,
        best: bestSubj,
        worst: worstSubj,
      }
    }, [marks])

  // Ranking bars staggered animation effect
  useEffect(() => {
    if (ranked.length === 0) return
    const totalDuration = 600
    const staggerDelay = 40
    let startTime: number | null = null
    rankBarRafRef.current = requestAnimationFrame(function step(ts) {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime
      const newP = ranked.map((_, i) => {
        const itemElapsed = elapsed - i * staggerDelay
        if (itemElapsed <= 0) return 0
        const t = Math.min(itemElapsed / totalDuration, 1)
        return easeOutCubic(t)
      })
      setRankBarProgresses(newP)
      if (newP[newP.length - 1] < 1) rankBarRafRef.current = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(rankBarRafRef.current)
  }, [ranked.length])

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        content: { paddingBottom: spacing.xl },
        // Hero
        heroWrap: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
        heroLabel: {
          fontSize: 10,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 3,
          color: c.textTertiary,
        },
        heroSub: { fontSize: 12, color: c.textDim, marginTop: 2 },
        heroRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 20,
        },
        heroAvg: { fontSize: 56, fontWeight: '900', lineHeight: 56 },
        heroPct: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
        heroGradeLabel: { fontSize: 10, color: c.textDim, marginTop: 4 },
        quickStats: { flexDirection: 'row', gap: 16, marginTop: 16 },
        quickStatDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
        quickStatText: { fontSize: 10, color: c.textTertiary },
        // Tabs
        tabs: {
          flexDirection: 'row',
          backgroundColor: c.surfaceVariant,
          borderRadius: 12,
          padding: 4,
          marginHorizontal: spacing.md,
          marginTop: spacing.md,
        },
        tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
        tabActive: { backgroundColor: c.primary },
        tabText: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
        tabTextActive: { color: isDark ? '#FFF' : c.buttonText },
        // Stat pills
        pillsRow: {
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: spacing.md,
          marginTop: spacing.md,
        },
        pill: {
          flex: 1,
          borderRadius: 16,
          paddingVertical: 12,
          alignItems: 'center',
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        },
        pillValue: { fontSize: 18, fontWeight: '900', color: c.text },
        pillLabel: {
          fontSize: 8,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: c.textDark,
          marginTop: 2,
        },
        // Section card
        sectionCard: {
          marginHorizontal: spacing.md,
          marginTop: 12,
          backgroundColor: c.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: c.border,
          overflow: 'hidden',
        },
        sectionTitle: {
          fontSize: 12,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: c.textTertiary,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
        },
        // Subject ranking row
        rankRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        },
        rankNum: { fontSize: 18, fontWeight: '900', width: 28, textAlign: 'center' },
        rankInfo: { flex: 1 },
        rankName: { fontSize: 14, fontWeight: '600', color: c.text },
        rankBarOuter: {
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          marginTop: 6,
          backgroundColor: c.borderLight,
        },
        rankBarInner: { height: '100%', borderRadius: 3 },
        rankPctText: { fontSize: 12, fontWeight: '800', width: 42, textAlign: 'right' },
        gradeBadge: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
        },
        gradeBadgeText: { fontSize: 11, fontWeight: '900' },
        // Expanded area
        expandedWrap: { paddingHorizontal: 16, paddingBottom: 16 },
        trendCard: {
          borderRadius: 12,
          padding: 12,
          backgroundColor: c.cardAlt,
          borderWidth: 1,
          borderColor: c.border,
          marginBottom: 12,
        },
        trendTitle: {
          fontSize: 9,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: c.textDark,
          marginBottom: 8,
        },
        assessmentCard: {
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: c.cardAlt,
          borderWidth: 1,
          borderColor: c.border,
        },
        assessmentRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        assessTypeShort: {
          fontSize: 9,
          fontWeight: '900',
          width: 24,
          textAlign: 'center',
          color: c.textDark,
        },
        assessBarOuter: {
          flex: 1,
          height: 4,
          borderRadius: 2,
          overflow: 'hidden',
          marginHorizontal: 12,
          backgroundColor: c.borderLight,
        },
        assessBarInner: { height: '100%', borderRadius: 2 },
        assessScore: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: c.textTertiary },
        assessPct: { fontSize: 10, fontWeight: '700', width: 36, textAlign: 'right' },
        legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
        legendChip: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          backgroundColor: c.borderLight,
        },
        legendChipText: { fontSize: 8, color: c.textDim },
        // Attendance styles
        attOverallRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        attOverallLabel: { fontSize: 16, fontWeight: '600', color: c.text },
        attOverallValue: { fontSize: 28, fontWeight: '800' },
        attBar: {
          height: 8,
          backgroundColor: c.surfaceVariant,
          borderRadius: 4,
          marginTop: spacing.sm,
          overflow: 'hidden',
        },
        attBarFill: { height: '100%', borderRadius: 4 },
        attSub: { fontSize: 12, color: c.textSecondary, marginTop: spacing.xs },
        attSubjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        attSubjectName: { fontSize: 14, fontWeight: '600', color: c.text },
        attSubjectCode: { fontSize: 12, color: c.textSecondary },
        attSubjectPct: { fontSize: 22, fontWeight: '800' },
        attStatsRow: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: spacing.md,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: c.divider,
        },
        statItem: { alignItems: 'center' },
        statValue: { fontSize: 18, fontWeight: '700' },
        statLabel: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
        // Attendance donut section
        attDonutSection: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        attDonutInfo: { flex: 1 },
        attDonutTitle: { fontSize: 14, fontWeight: '600', color: c.text },
        attDonutSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        // Subject attendance bar chart
        attBarChartWrap: { paddingHorizontal: 16, paddingBottom: 16 },
      }),
    [c, spacing, isDark],
  )

  if (profileLoading) return <LoadingScreen />
  if (!profile?.students.length) return <EmptyState icon="graduation" title="No students linked" />

  const student = profile.students.find((s) => s.id === studentId) || profile.students[0]
  const isLoading = tab === 'attendance' ? attLoading : marksLoading
  const refetch = tab === 'attendance' ? refetchAtt : refetchMarks

  const gi = gradeInfoThemed(overallAvg, isDark)
  const chartWidth = SCREEN_WIDTH - spacing.md * 2 - 32 // card padding

  function toggleExpand(code: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedSubject(expandedSubject === code ? null : code)
  }

  // ── Attendance subject bar chart data ──
  const attBarData = attendance?.subjectStats?.map((s) => ({
    label: s.subject.code,
    present: s.present,
    absent: s.absent,
    od: s.od,
    leave: s.leave,
    total: s.total,
    pct: s.percentage,
  }))

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* ── Student Selector ── */}
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <StudentSelector
          students={profile.students}
          selectedId={studentId}
          onSelect={setSelectedStudentId}
        />
      </View>

      {/* ══════ HERO: Giant Grade ══════ */}
      {subjectResults.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)} style={[styles.heroWrap, { backgroundColor: isDark ? gi.bg : c.surface, borderBottomWidth: 1, borderBottomColor: isDark ? gi.bd : c.border }]}>
          <Text style={styles.heroLabel}>Academics</Text>
          <Text style={styles.heroSub}>
            {student.name} {'\u00B7'} {student.registerNumber}
          </Text>

          <View style={styles.heroRow}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={[styles.heroAvg, { color: gi.color }]}>{Math.round(overallAvg * heroAnim)}</Text>
                <Text style={[styles.heroPct, { color: gi.color + '80' }]}>%</Text>
              </View>
              <Text style={styles.heroGradeLabel}>
                Overall Average {'\u00B7'} Grade {gi.g}
              </Text>
            </View>
            <DonutChart
              percentage={overallAvg}
              color={gi.color}
              label={gi.g}
              size={64}
              strokeWidth={8}
              bgColor={isDark ? '#111111' : c.surfaceVariant}
            />
          </View>

          {/* Quick stats */}
          {best && worst && (
            <View style={styles.quickStats}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.quickStatDot, { backgroundColor: isDark ? '#4CAF50' : '#2E7D32' }]} />
                <Text style={styles.quickStatText}>
                  Best: {best.code} ({best.avg}%)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.quickStatDot, { backgroundColor: isDark ? '#E53935' : '#C62828' }]} />
                <Text style={styles.quickStatText}>
                  Needs work: {worst.code} ({worst.avg}%)
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* ── Tabs ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)} style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'marks' && styles.tabActive]}
          onPress={() => setTab('marks')}
        >
          <Text style={[styles.tabText, tab === 'marks' && styles.tabTextActive]}>Marks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'attendance' && styles.tabActive]}
          onPress={() => setTab('attendance')}
        >
          <Text style={[styles.tabText, tab === 'attendance' && styles.tabTextActive]}>
            Attendance
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {isLoading ? (
        <LoadingScreen />
      ) : tab === 'marks' ? (
        <>
          {/* ══════ STAT PILLS ══════ */}
          {subjectResults.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(120).springify().damping(18).stiffness(180)} style={styles.pillsRow}>
              <View style={styles.pill}>
                <Text style={styles.pillValue}>{totalSubjects}</Text>
                <Text style={styles.pillLabel}>Subjects</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillValue}>{totalAssessments}</Text>
                <Text style={styles.pillLabel}>Tests</Text>
              </View>
              <View style={styles.pill}>
                <Text style={[styles.pillValue, { color: isDark ? '#4CAF50' : '#2E7D32' }]}>
                  {topScore}%
                </Text>
                <Text style={styles.pillLabel}>Peak</Text>
              </View>
            </Animated.View>
          )}

          {/* ══════ RADAR: Performance Map ══════ */}
          {subjectResults.length > 2 && (
            <Animated.View entering={FadeInDown.duration(400).delay(180).springify().damping(18).stiffness(180)} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Performance Map</Text>
              <View style={{ alignItems: 'center', paddingBottom: 12 }}>
                <RadarChart
                  data={subjectResults.map((s) => ({ label: s.code, value: s.avg }))}
                  color={gi.color}
                  width={chartWidth}
                  height={240}
                  labelColor={c.textTertiary}
                  gridColor={c.borderLight}
                  bgFill={isDark ? '#111111' : c.surface}
                />
              </View>
            </Animated.View>
          )}

          {/* ══════ SUBJECT RANKING ══════ */}
          {ranked.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(240).springify().damping(18).stiffness(180)} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Ranking</Text>
              {ranked.map((s, i) => {
                const sg = gradeInfoThemed(s.avg, isDark)
                const isExpanded = expandedSubject === s.code
                const sparkData = s.assessments.map((a) => a.pct)

                return (
                  <View key={s.code}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleExpand(s.code)}
                      style={[
                        styles.rankRow,
                        i > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight },
                      ]}
                    >
                      {/* Rank number */}
                      <Text
                        style={[
                          styles.rankNum,
                          { color: i === 0 ? (isDark ? '#FAFAFA' : '#18181B') : c.textDarkest },
                        ]}
                      >
                        {i + 1}
                      </Text>

                      {/* Subject info + bar */}
                      <View style={styles.rankInfo}>
                        <Text style={styles.rankName} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={[styles.rankBarOuter, { flex: 1 }]}>
                            <View
                              style={[
                                styles.rankBarInner,
                                { width: `${s.avg * (rankBarProgresses[i] || 0)}%`, backgroundColor: sg.color },
                              ]}
                            />
                          </View>
                          <Text style={[styles.rankPctText, { color: sg.color }]}>{Math.round(s.avg * (rankBarProgresses[i] || 0))}%</Text>
                        </View>
                      </View>

                      {/* Grade badge */}
                      <View
                        style={[
                          styles.gradeBadge,
                          { backgroundColor: sg.bg, borderColor: sg.bd },
                        ]}
                      >
                        <Text style={[styles.gradeBadgeText, { color: sg.color }]}>{sg.g}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* ── Expanded: Assessment Details ── */}
                    {isExpanded && (
                      <View style={styles.expandedWrap}>
                        {/* Sparkline trend */}
                        {sparkData.length > 1 && (
                          <View style={styles.trendCard}>
                            <Text style={styles.trendTitle}>Trend</Text>
                            <SparklineChart
                              data={sparkData}
                              color={sg.color}
                              width={chartWidth - 24}
                              height={60}
                              bgColor={isDark ? '#111111' : c.surface}
                            />
                          </View>
                        )}

                        {/* Assessment scores */}
                        <View style={styles.assessmentCard}>
                          {s.assessments.map((a, ai) => {
                            const ac = scoreColor(a.pct, isDark)
                            return (
                              <View
                                key={a.id}
                                style={[
                                  styles.assessmentRow,
                                  ai < s.assessments.length - 1 && {
                                    borderBottomWidth: 1,
                                    borderBottomColor: c.borderLight,
                                  },
                                ]}
                              >
                                <Text style={styles.assessTypeShort}>
                                  {TYPE_SHORT[a.type] || '??'}
                                </Text>
                                <View style={styles.assessBarOuter}>
                                  <View
                                    style={[
                                      styles.assessBarInner,
                                      { width: `${a.pct}%`, backgroundColor: ac },
                                    ]}
                                  />
                                </View>
                                <Text style={styles.assessScore}>
                                  {a.score}/{a.maxScore}
                                </Text>
                                <Text style={[styles.assessPct, { color: ac }]}>{a.pct}%</Text>
                              </View>
                            )
                          })}
                        </View>

                        {/* Assessment type legend */}
                        <View style={styles.legendRow}>
                          {s.assessments.map((a) => (
                            <View key={a.id} style={styles.legendChip}>
                              <Text style={styles.legendChipText}>
                                {TYPE_SHORT[a.type]} = {TYPE_LABELS[a.type] || a.type}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )
              })}
            </Animated.View>
          )}

          {/* ══════ HEAD TO HEAD BAR CHART ══════ */}
          {subjectResults.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(300).springify().damping(18).stiffness(180)} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Head to Head</Text>
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <HorizontalBarChart
                  data={subjectResults.map((s) => ({ label: s.code, value: s.avg }))}
                  width={chartWidth}
                  labelColor={c.textTertiary}
                  bgBarColor={c.borderLight}
                  isDark={isDark}
                />
              </View>
            </Animated.View>
          )}

          {subjectResults.length === 0 && (
            <EmptyState icon="document" title="No marks data" />
          )}
        </>
      ) : /* ══════ ATTENDANCE TAB ══════ */
      attendance ? (
        <>
          {/* Overall attendance with donut */}
          <Animated.View entering={FadeInDown.duration(400).delay(120).springify().damping(18).stiffness(180)} style={[styles.sectionCard, { marginTop: spacing.md }]}>
            <View style={styles.attDonutSection}>
              <View style={styles.attDonutInfo}>
                <Text style={styles.attDonutTitle}>Overall Attendance</Text>
                <Text style={styles.attDonutSub}>
                  {attendance.totalPresent} present out of {attendance.totalRecords} classes
                </Text>
              </View>
              <DonutChart
                percentage={attendance.overallPercentage}
                color={attendance.overallPercentage < 75 ? c.error : c.success}
                label={`${attendance.overallPercentage}%`}
                size={72}
                strokeWidth={8}
                bgColor={isDark ? '#111111' : c.surfaceVariant}
              />
            </View>
            {/* Overall bar */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <View style={styles.attBar}>
                <View
                  style={[
                    styles.attBarFill,
                    {
                      width: `${attendance.overallPercentage}%`,
                      backgroundColor:
                        attendance.overallPercentage < 75 ? c.error : c.success,
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>

          {/* Subject attendance stacked bar chart */}
          {attBarData && attBarData.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(180).springify().damping(18).stiffness(180)} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Subject Attendance</Text>
              <View style={styles.attBarChartWrap}>
                <SubjectAttendanceBars data={attBarData} width={chartWidth} isDark={isDark} />
              </View>
              {/* Legend */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 16,
                  paddingBottom: 12,
                }}
              >
                <LegendDot color={isDark ? '#4CAF50' : '#2E7D32'} label="Present" labelColor={c.textSecondary} />
                <LegendDot color={c.error} label="Absent" labelColor={c.textSecondary} />
                <LegendDot color={isDark ? '#FAFAFA' : '#18181B'} label="OD" labelColor={c.textSecondary} />
                <LegendDot color={c.warning} label="Leave" labelColor={c.textSecondary} />
              </View>
            </Animated.View>
          )}

          {/* Per-subject detail cards */}
          {attendance.subjectStats.map((stat, index) => (
            <Animated.View key={stat.subject.id} entering={FadeInDown.duration(400).delay(240 + index * 60).springify().damping(18).stiffness(180)} style={[styles.sectionCard]}>
              <View style={{ padding: 16 }}>
                <View style={styles.attSubjectHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attSubjectName}>{stat.subject.name}</Text>
                    <Text style={styles.attSubjectCode}>{stat.subject.code}</Text>
                  </View>
                  <Text
                    style={[
                      styles.attSubjectPct,
                      { color: stat.percentage < 75 ? c.error : c.success },
                    ]}
                  >
                    {formatPercentage(stat.percentage)}
                  </Text>
                </View>
                <View style={styles.attStatsRow}>
                  <StatItem label="Present" value={stat.present} color={c.success} styles={styles} />
                  <StatItem label="Absent" value={stat.absent} color={c.error} styles={styles} />
                  <StatItem label="OD" value={stat.od} color={isDark ? c.primary : c.info} styles={styles} />
                  <StatItem label="Leave" value={stat.leave} color={c.warning} styles={styles} />
                </View>
              </View>
            </Animated.View>
          ))}
        </>
      ) : (
        <EmptyState icon="chart" title="No attendance data" />
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}

// ── Sub-components ─────────────────────────────────────────

function StatItem({
  label,
  value,
  color,
  styles,
}: {
  label: string
  value: number
  color: string
  styles: any
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function LegendDot({
  color,
  label,
  labelColor,
}: {
  color: string
  label: string
  labelColor: string
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} />
      <Text style={{ fontSize: 10, color: labelColor }}>{label}</Text>
    </View>
  )
}

/** Stacked horizontal bar chart for subject attendance — animated staggered growth */
function SubjectAttendanceBars({
  data,
  width,
  isDark,
}: {
  data: {
    label: string
    present: number
    absent: number
    od: number
    leave: number
    total: number
    pct: number
  }[]
  width: number
  isDark: boolean
}) {
  const barH = 16
  const rowH = 34
  const leftPad = 40
  const rightPad = 40
  const barArea = width - leftPad - rightPad
  const svgH = data.length * rowH + 8
  const presentColor = isDark ? '#4CAF50' : '#2E7D32'
  const absentColor = isDark ? '#E53935' : '#C62828'
  const odColor = isDark ? '#FAFAFA' : '#18181B'
  const leaveColor = isDark ? '#FF9800' : '#E65100'
  const labelColor = isDark ? '#71717A' : '#A1A1AA'
  const bgBarColor = isDark ? '#1A1815' : '#E8D9C5'

  // Staggered animation
  const totalDuration = 600
  const staggerDelay = 40
  const [progresses, setProgresses] = useState<number[]>(() => data.map(() => 0))
  const rafRef = useRef<number>(0)

  useEffect(() => {
    let startTime: number | null = null
    rafRef.current = requestAnimationFrame(function step(ts) {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime
      const newP = data.map((_, i) => {
        const itemElapsed = elapsed - i * staggerDelay
        if (itemElapsed <= 0) return 0
        const t = Math.min(itemElapsed / totalDuration, 1)
        return easeOutCubic(t)
      })
      setProgresses(newP)
      if (newP[newP.length - 1] < 1) rafRef.current = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(rafRef.current)
  }, [data.length])

  return (
    <Svg width={width} height={svgH}>
      {data.map((d, i) => {
        const y = i * rowH + 4
        const total = d.total || 1
        const p = progresses[i] || 0
        const pW = (d.present / total) * barArea * p
        const aW = (d.absent / total) * barArea * p
        const oW = (d.od / total) * barArea * p
        const lW = (d.leave / total) * barArea * p

        return (
          <G key={i}>
            <SvgText
              x={leftPad - 6}
              y={y + barH / 2}
              fill={labelColor}
              fontSize={10}
              fontWeight="700"
              textAnchor="end"
              alignmentBaseline="central"
            >
              {d.label}
            </SvgText>
            {/* Background */}
            <Rect x={leftPad} y={y} width={barArea} height={barH} rx={4} fill={bgBarColor} />
            {/* Stacked segments */}
            <Rect x={leftPad} y={y} width={pW} height={barH} rx={0} fill={presentColor} />
            <Rect x={leftPad + pW} y={y} width={aW} height={barH} rx={0} fill={absentColor} />
            <Rect x={leftPad + pW + aW} y={y} width={oW} height={barH} rx={0} fill={odColor} />
            <Rect
              x={leftPad + pW + aW + oW}
              y={y}
              width={lW}
              height={barH}
              rx={0}
              fill={leaveColor}
            />
            {/* Percentage label */}
            <SvgText
              x={leftPad + barArea + 6}
              y={y + barH / 2}
              fill={d.pct < 75 ? absentColor : presentColor}
              fontSize={10}
              fontWeight="700"
              textAnchor="start"
              alignmentBaseline="central"
              opacity={p}
            >
              {d.pct}%
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}
