import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sun,
  Moon,
  GraduationCap,
  AlertTriangle,
  CreditCard,
  BookOpen,
  Bell,
  Activity,
  ChevronRight,
} from 'lucide-react-native'
import Svg, {
  Circle,
  Rect,
  Line,
  Path,
  G,
  Defs,
  ClipPath,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { getDashboard, acknowledgeAlert, getAttendance, getMarks } from '../api/endpoints'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useStudentSelector } from '../hooks/useStudentSelector'
import { AlertBanner } from '../components/AlertBanner'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { formatCurrency, formatRelative } from '../utils/format'

const SCREEN_WIDTH = Dimensions.get('window').width
const CHART_PADDING = 32
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING

// Premium spring-like easing with subtle overshoot for professional chart animations
const easeOutBack = (t: number): number => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Clamp to prevent overshoot artifacts on visual elements (arcs, bars)
const clampedSpringEase = (t: number): number => Math.min(1, Math.max(0, easeOutBack(t)))

// ─── ScalePressable ────────────────────────────────────────
// A TouchableOpacity wrapper that adds a slight scale-down animation on press
function ScalePressable({
  onPress,
  children,
  style,
}: {
  onPress: () => void
  children: React.ReactNode
  style?: any
}) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 })
  }, [scale])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 })
  }, [scale])

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  )
}

// ─── AttendanceDonut ────────────────────────────────────────
function AttendanceDonut({
  percent,
  textColor,
  trackColor,
}: {
  percent: number
  textColor: string
  trackColor: string
}) {
  const size = 80
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const presentArc = (percent / 100) * circumference
  const greenColor = '#4CAF50'
  const redColor = '#E53935'

  const [progress, setProgress] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 650
    const animate = () => {
      const elapsed = Date.now() - start
      const t = Math.min(elapsed / duration, 1)
      const eased = clampedSpringEase(t)
      setProgress(eased)
      if (t < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const animatedArc = progress * presentArc
  const animatedAbsentArc = progress * (circumference - presentArc)
  const displayPercent = Math.round(progress * percent)

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Present arc (green) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={greenColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${animatedArc} ${circumference - animatedArc}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
        {/* Absent arc (red) — only if there's absent portion and it's meaningful */}
        {percent < 100 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={redColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${animatedAbsentArc} ${circumference - animatedAbsentArc}`}
            strokeDashoffset={circumference * 0.25 - animatedArc}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
        {/* Center text */}
        <SvgText
          x={size / 2}
          y={size / 2 + 5}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill={textColor}
        >
          {displayPercent}%
        </SvgText>
      </Svg>
    </View>
  )
}

// ─── ScoreSparkline ─────────────────────────────────────────
function ScoreSparkline({
  data,
  textColor,
}: {
  data: { name: string; value: number }[]
  textColor: string
}) {
  if (data.length === 0) return null

  const w = 100
  const h = 36
  const padding = 2
  const plotW = w - padding * 2
  const plotH = h - padding * 2
  const minVal = Math.min(...data.map((d) => d.value))
  const maxVal = Math.max(...data.map((d) => d.value))
  const range = maxVal - minVal || 1

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * plotW,
    y: padding + plotH - ((d.value - minVal) / range) * plotH,
  }))

  // Build line path
  let linePath = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx1 = prev.x + (curr.x - prev.x) / 3
    const cpy1 = prev.y
    const cpx2 = curr.x - (curr.x - prev.x) / 3
    const cpy2 = curr.y
    linePath += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`
  }

  // Area path (same line + close to bottom)
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`

  // Animate: draw-in from left to right via strokeDasharray/strokeDashoffset
  const [progress, setProgress] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 500
    const animate = () => {
      const elapsed = Date.now() - start
      const t = Math.min(elapsed / duration, 1)
      const eased = clampedSpringEase(t)
      setProgress(eased)
      if (t < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  // Use a clipping rect to reveal from left to right
  const clipWidth = progress * w

  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgLinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FAFAFA" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#FAFAFA" stopOpacity="0" />
        </SvgLinearGradient>
        <ClipPath id="sparkClip">
          <Rect x={0} y={0} width={clipWidth} height={h} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#sparkClip)">
        <Path d={areaPath} fill="url(#sparkGrad)" />
        <Path d={linePath} stroke="#FAFAFA" strokeWidth={1.5} fill="none" />
      </G>
    </Svg>
  )
}

// ─── FeeMiniBar ─────────────────────────────────────────────
function FeeMiniBar({
  paid,
  total,
  trackColor,
}: {
  paid: number
  total: number
  trackColor: string
}) {
  const pct = total > 0 ? (paid / total) * 100 : 100
  const fillColor = total > 0 && paid < total ? '#FF9800' : '#4CAF50'

  const [progress, setProgress] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 450
    const animate = () => {
      const elapsed = Date.now() - start
      const t = Math.min(elapsed / duration, 1)
      const eased = clampedSpringEase(t)
      setProgress(eased)
      if (t < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const animatedPct = progress * Math.min(pct, 100)

  return (
    <View
      style={{
        width: '100%',
        height: 8,
        borderRadius: 4,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${animatedPct}%` as any,
          height: '100%',
          borderRadius: 4,
          backgroundColor: fillColor,
        }}
      />
    </View>
  )
}

// ─── AttendanceTrendChart ───────────────────────────────────
function AttendanceTrendChart({
  data,
  textColor,
  mutedColor,
  borderColor,
}: {
  data: { label: string; rate: number }[]
  textColor: string
  mutedColor: string
  borderColor: string
}) {
  if (data.length === 0) return null

  const w = CHART_WIDTH - 32 // inner padding
  const h = 180
  const padLeft = 32
  const padRight = 8
  const padTop = 10
  const padBottom = 24
  const plotW = w - padLeft - padRight
  const plotH = h - padTop - padBottom

  const [progress, setProgress] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 700
    const animate = () => {
      const elapsed = Date.now() - start
      const t = Math.min(elapsed / duration, 1)
      const eased = clampedSpringEase(t)
      setProgress(eased)
      if (t < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const bottomY = padTop + plotH

  // Interpolate points from bottom to actual position based on progress
  const points = data.map((d, i) => {
    const targetY = padTop + plotH - (d.rate / 100) * plotH
    return {
      x: padLeft + (i / Math.max(data.length - 1, 1)) * plotW,
      y: bottomY + (targetY - bottomY) * progress,
    }
  })

  // Build smooth polyline
  let linePath = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx1 = prev.x + (curr.x - prev.x) / 3
    const cpy1 = prev.y
    const cpx2 = curr.x - (curr.x - prev.x) / 3
    const cpy2 = curr.y
    linePath += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`
  }

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`

  // Y-axis labels: 0, 25, 50, 75, 100
  const yLabels = [0, 25, 50, 75, 100]
  // X-axis labels: show a subset
  const step = Math.max(1, Math.floor(data.length / 5))
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgLinearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#4CAF50" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>

      {/* Grid lines + Y labels */}
      {yLabels.map((val) => {
        const y = padTop + plotH - (val / 100) * plotH
        return (
          <G key={`y-${val}`}>
            <Line
              x1={padLeft}
              y1={y}
              x2={padLeft + plotW}
              y2={y}
              stroke={borderColor}
              strokeWidth={0.5}
            />
            <SvgText
              x={padLeft - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fill={mutedColor}
            >
              {val}
            </SvgText>
          </G>
        )
      })}

      {/* Area fill */}
      <Path d={areaPath} fill="url(#attendGrad)" />

      {/* Line */}
      <Path d={linePath} stroke="#4CAF50" strokeWidth={2} fill="none" />

      {/* X-axis labels */}
      {xLabels.map((d) => {
        const idx = data.indexOf(d)
        const x = padLeft + (idx / Math.max(data.length - 1, 1)) * plotW
        return (
          <SvgText
            key={`x-${idx}`}
            x={x}
            y={h - 4}
            textAnchor="middle"
            fontSize={8}
            fill={mutedColor}
          >
            {d.label}
          </SvgText>
        )
      })}
    </Svg>
  )
}

// ─── SubjectPerformanceChart ────────────────────────────────
function SubjectPerformanceChart({
  data,
  textColor,
  mutedColor,
  borderColor,
}: {
  data: { subject: string; score: number }[]
  textColor: string
  mutedColor: string
  borderColor: string
}) {
  if (data.length === 0) return null

  const barHeight = 20
  const gap = 14
  const padLeft = 80
  const padRight = 40
  const padTop = 4
  const w = CHART_WIDTH - 32
  const totalH = padTop + data.length * (barHeight + gap)
  const barAreaW = w - padLeft - padRight

  const staggerDelay = 70
  const baseDuration = 500

  const [progresses, setProgresses] = useState<number[]>(() => data.map(() => 0))
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = Date.now()
    const animate = () => {
      const now = Date.now()
      const newProgresses = data.map((_, i) => {
        const elapsed = now - start - i * staggerDelay
        if (elapsed <= 0) return 0
        const t = Math.min(elapsed / baseDuration, 1)
        return clampedSpringEase(t)
      })
      setProgresses(newProgresses)
      const allDone = newProgresses.every((p) => p >= 1)
      if (!allDone) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [data.length])

  return (
    <Svg width={w} height={totalH}>
      {data.map((d, i) => {
        const y = padTop + i * (barHeight + gap)
        const targetBarW = (d.score / 100) * barAreaW
        const animatedBarW = progresses[i] * targetBarW
        const displayScore = Math.round(progresses[i] * d.score)
        return (
          <G key={d.subject}>
            {/* Subject label */}
            <SvgText
              x={padLeft - 8}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fontSize={11}
              fill={mutedColor}
            >
              {d.subject}
            </SvgText>

            {/* Background track */}
            <Rect
              x={padLeft}
              y={y}
              width={barAreaW}
              height={barHeight}
              rx={4}
              fill={borderColor}
            />

            {/* Score bar */}
            <Rect
              x={padLeft}
              y={y}
              width={Math.max(animatedBarW, 4)}
              height={barHeight}
              rx={4}
              fill="#FAFAFA"
            />

            {/* Score label */}
            <SvgText
              x={padLeft + barAreaW + 6}
              y={y + barHeight / 2 + 4}
              textAnchor="start"
              fontSize={11}
              fontWeight="bold"
              fill={textColor}
            >
              {displayScore}%
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}

// ═════════════════════════════════════════════════════════════
// Main Dashboard Screen
// ═════════════════════════════════════════════════════════════
export function DashboardScreen() {
  const { user } = useAuth()
  const { c, spacing, toggle, isDark } = useTheme()
  const queryClient = useQueryClient()
  const navigation = useNavigation()

  // ── Navigation helpers ──
  const navigateToAcademics = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'AcademicsTab',
      })
    )
  }, [navigation])

  const navigateToFees = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'MoreTab',
        params: {
          screen: 'Fees',
        },
      })
    )
  }, [navigation])

  const navigateToNotifications = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'MoreTab',
        params: {
          screen: 'Notifications',
        },
      })
    )
  }, [navigation])

  // ── Dashboard data ──
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  const ackMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  })

  // Pick first student
  const students = data?.students ?? []
  const { selectedStudent } = useStudentSelector(students)
  const studentId = selectedStudent?.id ?? ''

  // ── Extra API calls for charts ──
  const { data: attendance } = useQuery({
    queryKey: ['attendance', studentId],
    queryFn: () => getAttendance(studentId),
    enabled: !!studentId,
  })

  const { data: marks } = useQuery({
    queryKey: ['marks', studentId],
    queryFn: () => getMarks(studentId),
    enabled: !!studentId,
  })

  // ── Derived data ──
  const attendancePercent = attendance?.overallPercentage ?? 0
  const isAttendanceLow = attendancePercent < 75

  const recentMarks = marks?.slice(0, 10) ?? []
  const avgScore =
    recentMarks.length > 0
      ? Math.round(
          recentMarks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) /
            recentMarks.length
        )
      : 0

  const sparklineData = useMemo(
    () =>
      [...recentMarks]
        .reverse()
        .map((m) => ({ name: m.subject.code, value: Math.round((m.score / m.maxScore) * 100) })),
    [recentMarks]
  )

  const pendingFees = data?.pendingFees ?? []
  const totalDue = pendingFees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0)
  const totalFeeAmount = pendingFees.reduce((sum, f) => sum + f.totalAmount, 0)
  const totalPaid = pendingFees.reduce((sum, f) => sum + f.paidAmount, 0)

  const notifications = data?.notifications ?? []
  const unreadNotifications = notifications.filter((n) => !n.isRead).length

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ?? 'P'

  // Attendance trend: use per-subject stats as data points (daily records not available via API)
  const attendanceTrendData = useMemo(() => {
    if (!attendance?.subjectStats?.length) return []
    return attendance.subjectStats.map((s) => ({
      label: s.subject.code,
      rate: s.percentage,
    }))
  }, [attendance])

  // Subject performance: average per subject from all marks
  const subjectPerformanceData = useMemo(() => {
    if (!marks?.length) return []
    const map = new Map<string, { total: number; count: number; name: string }>()
    for (const m of marks) {
      const entry = map.get(m.subjectId) || { total: 0, count: 0, name: m.subject.name }
      entry.total += (m.score / m.maxScore) * 100
      entry.count++
      map.set(m.subjectId, entry)
    }
    return Array.from(map.values())
      .map(({ name, total, count }) => ({
        subject: name.length > 12 ? name.slice(0, 12) + '..' : name,
        score: Math.round(total / count),
      }))
      .sort((a, b) => b.score - a.score)
  }, [marks])

  // ── Styles ──
  const s = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: c.background } as const,
      content: { padding: spacing.md, gap: spacing.md } as const,
      headerRow: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
      },
      headerLeft: {} as const,
      greeting: { fontSize: 22, fontWeight: '800' as const, color: c.text },
      subGreeting: { fontSize: 12, color: c.textMuted, marginTop: 2 },
      headerRight: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
      },
      themeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: c.surface,
        borderWidth: 2,
        borderColor: c.primaryDark,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      avatarText: { fontSize: 14, fontWeight: '700' as const, color: c.primary },
      studentCard: {
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: '#27272A',
        overflow: 'hidden' as const,
      },
      studentRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 12,
      },
      studentIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#27272A',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      studentName: { fontSize: 16, fontWeight: '700' as const, color: c.text },
      studentSub: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
      studentDetail: { fontSize: 12, color: c.textMuted, marginTop: 1 },
      metricGrid: {
        flexDirection: 'row' as const,
        gap: 12,
        height: 310,
      },
      metricCol: { flex: 1, gap: 12 } as const,
      metricCard: {
        flex: 1,
        borderRadius: 16,
        padding: spacing.md,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      metricCardLeft: {
        flex: 1,
        borderRadius: 16,
        padding: spacing.md,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        justifyContent: 'space-between' as const,
      },
      metricLabel: { fontSize: 12, color: c.textSecondary, marginTop: 4 },
      metricLabelSmall: {
        fontSize: 10,
        fontWeight: '500' as const,
        color: c.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.8,
      },
      lowWarning: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
        marginTop: 4,
      },
      lowWarningText: { fontSize: 10, fontWeight: '600' as const, color: '#E53935' },
      avgScoreValue: {
        fontSize: 26,
        fontWeight: '800' as const,
        color: c.primaryDark,
      },
      feeDueIcon: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 6,
      },
      feeDueAmount: {
        fontSize: 24,
        fontWeight: '800' as const,
      },
      feeDueSub: { fontSize: 10, color: c.textMuted, marginTop: 2 },
      unreadCard: {
        flex: 1,
        borderRadius: 16,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 12,
      },
      unreadCount: { fontSize: 20, fontWeight: '800' as const, color: c.text },
      unreadLabel: { fontSize: 10, color: c.textMuted },
      bellDot: {
        position: 'absolute' as const,
        top: -3,
        right: -3,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E53935',
      },
      chartCard: {
        borderRadius: 16,
        padding: spacing.md,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
      },
      chartHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 12,
      },
      chartTitle: { fontSize: 14, fontWeight: '600' as const, color: c.text },
      chartSubtitle: { fontSize: 10, color: c.textMuted },
      activityHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 12,
      },
      activityTitleRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 6,
      },
      activityViewAll: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 2,
      },
      activityViewAllText: { fontSize: 12, color: '#A1A1AA' },
      activityItem: {
        paddingVertical: 10,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: 'transparent',
      },
      activityItemUnread: {
        borderLeftColor: '#A1A1AA',
      },
      activityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
      },
      activityTitle: { fontSize: 13, color: c.textTertiary },
      activityTitleUnread: { fontSize: 13, fontWeight: '600' as const, color: c.text },
      activityMessage: { fontSize: 11, color: c.textMuted, marginTop: 2 },
      activityTime: { fontSize: 11, color: c.textMuted, marginTop: 4 },
      activityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
      },
      activityRow: {
        flexDirection: 'row' as const,
        gap: 10,
      },
      emptyActivity: {
        fontSize: 13,
        color: c.textMuted,
        textAlign: 'center' as const,
        paddingVertical: 24,
      },
    }),
    [c, spacing]
  )

  // ── Loading / Error ──
  if (isLoading) return <LoadingScreen />
  if (!data) return <EmptyState title="Could not load dashboard" />

  if (!selectedStudent) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.greeting}>Hello, {firstName}!</Text>
        <View style={[s.chartCard, { alignItems: 'center', paddingVertical: 40 }]}>
          <View style={s.studentIcon}>
            <GraduationCap size={28} color={c.textMuted} />
          </View>
          <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 12 }}>
            No student linked to your account yet.
          </Text>
          <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>
            Please contact the college administration.
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refetch} tintColor={c.primary} />
      }
    >
      {/* 1. Greeting + Theme Toggle + Avatar */}
      <Animated.View entering={FadeInDown.duration(400).springify().damping(18).stiffness(180)}>
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <Text style={s.greeting}>Hello, {firstName}!</Text>
          <Text style={s.subGreeting}>
            {selectedStudent.name} &middot; {selectedStudent.department.code}
          </Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.themeButton} onPress={toggle} activeOpacity={0.7}>
            {isDark ? (
              <Sun size={18} color={c.primary} />
            ) : (
              <Moon size={18} color={c.primary} />
            )}
          </TouchableOpacity>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>
      </Animated.View>

      {/* 2. Student Info Card with gradient */}
      <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)}>
      <LinearGradient
        colors={[c.gradientStart, c.gradientMid, c.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.studentCard}
      >
        <View style={s.studentRow}>
          <View style={s.studentIcon}>
            <GraduationCap size={20} color={c.primaryDark} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.studentName} numberOfLines={1}>
              {selectedStudent.name}
            </Text>
            <Text style={s.studentSub} numberOfLines={1}>
              {selectedStudent.registerNumber} &middot; {selectedStudent.department.name}
            </Text>
            <Text style={s.studentDetail}>
              Year {selectedStudent.year} &middot; Semester {selectedStudent.semester} &middot;
              Section {selectedStudent.section}
            </Text>
          </View>
        </View>
      </LinearGradient>
      </Animated.View>

      {/* 3. 2x2 Metric Grid */}
      <Animated.View entering={FadeInDown.duration(450).delay(120).springify().damping(16).stiffness(160)}>
      <View style={s.metricGrid}>
        {/* Left column: Attendance + Avg Score */}
        <View style={s.metricCol}>
          {/* Attendance Donut */}
          <ScalePressable onPress={navigateToAcademics} style={{ flex: 1 }}>
            <View style={[s.metricCard, { flex: 1 }]}>
              <AttendanceDonut
                percent={attendancePercent}
                textColor={c.text}
                trackColor={c.borderLight}
              />
              <Text style={s.metricLabel}>Attendance</Text>
              {isAttendanceLow && (
                <View style={s.lowWarning}>
                  <AlertTriangle size={10} color="#E53935" />
                  <Text style={s.lowWarningText}>Below 75%</Text>
                </View>
              )}
            </View>
          </ScalePressable>

          {/* Avg Score + Sparkline */}
          <ScalePressable onPress={navigateToAcademics} style={{ flex: 1 }}>
            <View style={[s.metricCard, { flex: 1 }]}>
              <BookOpen size={16} color={c.primaryDark} />
              <Text style={s.avgScoreValue}>{avgScore > 0 ? `${avgScore}%` : 'N/A'}</Text>
              <Text style={s.metricLabel}>Avg Score</Text>
              <View style={{ marginTop: 4 }}>
                <ScoreSparkline data={sparklineData} textColor={c.text} />
              </View>
            </View>
          </ScalePressable>
        </View>

        {/* Right column: Fees Due + Unread Alerts */}
        <View style={s.metricCol}>
          {/* Fees Due */}
          <ScalePressable onPress={navigateToFees} style={{ flex: 4 }}>
            <View style={[s.metricCardLeft, { flex: 1 }]}>
              <View style={s.feeDueIcon}>
                <CreditCard size={16} color={totalDue > 0 ? '#A1A1AA' : '#4CAF50'} />
                <Text style={s.metricLabelSmall}>FEES DUE</Text>
              </View>
              <View>
                <Text
                  style={[
                    s.feeDueAmount,
                    { color: totalDue > 0 ? '#A1A1AA' : '#4CAF50' },
                  ]}
                >
                  {totalDue > 0
                    ? `\u20B9${totalDue.toLocaleString('en-IN')}`
                    : 'All Paid'}
                </Text>
                <Text style={s.feeDueSub}>
                  of \u20B9{totalFeeAmount.toLocaleString('en-IN')} total
                </Text>
              </View>
              <FeeMiniBar paid={totalPaid} total={totalFeeAmount} trackColor={c.border} />
            </View>
          </ScalePressable>

          {/* Unread Alerts */}
          <ScalePressable onPress={navigateToNotifications} style={{ flex: 2 }}>
            <View style={[s.unreadCard, { flex: 1 }]}>
              <View style={{ position: 'relative' }}>
                <Bell size={16} color={c.primaryDark} />
                {unreadNotifications > 0 && <View style={s.bellDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.unreadCount}>{unreadNotifications}</Text>
                <Text style={s.unreadLabel}>Unread Alerts</Text>
              </View>
            </View>
          </ScalePressable>
        </View>
      </View>
      </Animated.View>

      {/* 4. Emergency Alerts */}
      <Animated.View entering={FadeInDown.duration(400).delay(180).springify().damping(18).stiffness(180)}>
      <AlertBanner
        alerts={data.alerts}
        onAcknowledge={(id) => ackMutation.mutate(id)}
      />
      </Animated.View>

      {/* 5. Attendance Trend Chart */}
      {attendanceTrendData.length > 0 && (
        <Animated.View entering={FadeInDown.duration(450).delay(240).springify().damping(16).stiffness(160)}>
        <ScalePressable onPress={navigateToAcademics}>
          <View style={s.chartCard}>
            <View style={s.chartHeader}>
              <Text style={s.chartTitle}>Attendance Trend</Text>
              <Text style={s.chartSubtitle}>Per subject</Text>
            </View>
            <AttendanceTrendChart
              data={attendanceTrendData}
              textColor={c.text}
              mutedColor={c.textMuted}
              borderColor={c.border}
            />
          </View>
        </ScalePressable>
        </Animated.View>
      )}

      {/* 6. Subject Performance Chart */}
      {subjectPerformanceData.length > 0 && (
        <Animated.View entering={FadeInDown.duration(450).delay(300).springify().damping(16).stiffness(160)}>
        <ScalePressable onPress={navigateToAcademics}>
          <View style={s.chartCard}>
            <View style={s.chartHeader}>
              <Text style={s.chartTitle}>Subject Performance</Text>
              <Text style={s.chartSubtitle}>Avg %</Text>
            </View>
            <SubjectPerformanceChart
              data={subjectPerformanceData}
              textColor={c.text}
              mutedColor={c.textMuted}
              borderColor={c.border}
            />
          </View>
        </ScalePressable>
        </Animated.View>
      )}

      {/* 7. Recent Activity Feed */}
      <Animated.View entering={FadeInDown.duration(450).delay(360).springify().damping(16).stiffness(160)}>
      <View style={s.chartCard}>
        <View style={s.activityHeader}>
          <View style={s.activityTitleRow}>
            <Activity size={16} color={c.primaryDark} />
            <Text style={s.chartTitle}>Recent Activity</Text>
          </View>
          <View style={s.activityViewAll}>
            <Text style={s.activityViewAllText}>View all</Text>
            <ChevronRight size={12} color="#A1A1AA" />
          </View>
        </View>

        {notifications.length === 0 ? (
          <Text style={s.emptyActivity}>No recent activity</Text>
        ) : (
          <View>
            {notifications.slice(0, 4).map((n, i) => (
              <View
                key={n.id}
                style={[
                  s.activityItem,
                  !n.isRead && s.activityItemUnread,
                  i < Math.min(notifications.length, 4) - 1 && s.activityItemBorder,
                ]}
              >
                <View style={s.activityRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={n.isRead ? s.activityTitle : s.activityTitleUnread}
                      numberOfLines={1}
                    >
                      {n.title}
                    </Text>
                    <Text style={s.activityMessage} numberOfLines={1}>
                      {n.message}
                    </Text>
                    <Text style={s.activityTime}>{formatRelative(n.createdAt)}</Text>
                  </View>
                  {!n.isRead && (
                    <View
                      style={[
                        s.activityDot,
                        {
                          backgroundColor:
                            n.priority === 'CRITICAL'
                              ? '#E53935'
                              : n.priority === 'HIGH'
                              ? '#A1A1AA'
                              : '#A1A1AA',
                        },
                      ]}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      </Animated.View>

      {/* Bottom spacing */}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}
