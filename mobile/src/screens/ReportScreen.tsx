import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { BarChart } from 'react-native-chart-kit'
import {
  FileText,
  UserCheck,
  Wallet,
  UtensilsCrossed,
  CreditCard,
  MapPin,
  Navigation,
} from 'lucide-react-native'
import { getWeeklyReport } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import { formatCurrency, formatDate } from '../utils/format'
import type { ThemeColors } from '../theme'

// ── Icon map for metric cards ──
const METRIC_ICONS: Record<string, React.ComponentType<any>> = {
  Attendance: UserCheck,
  Spending: Wallet,
  'Meals/Day': UtensilsCrossed,
  'Fees Due': CreditCard,
  'Check-ins': MapPin,
  'OD Trips': Navigation,
}

// ── useCountUp hook ──
function useCountUp(target: number, duration = 800, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now()
      let frame: number
      const animate = () => {
        const elapsed = Date.now() - start
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setValue(Math.round(eased * target))
        if (t < 1) frame = requestAnimationFrame(animate)
      }
      frame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(frame)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, duration, delay])
  return value
}

// ── Extract numeric value from formatted string ──
function extractNumeric(value: string): number | null {
  const match = value.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : null
}

// ── Metric Card ──
function MetricCard({
  label,
  value,
  sub,
  color,
  c,
  index,
}: {
  label: string
  value: string
  sub: string
  color: string
  c: ThemeColors
  index: number
}) {
  const Icon = METRIC_ICONS[label]

  // Count up numeric portion of value
  const numericTarget = extractNumeric(value)
  const countedValue = useCountUp(numericTarget ?? 0, 800, index * 80 + 200)

  // Reconstruct the display value with the counted number
  const displayValue = numericTarget !== null
    ? value.replace(/[\d.]+/, String(countedValue))
    : value

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 80).springify().damping(12).stiffness(80)}
      style={{
        width: '48%' as any,
        backgroundColor: c.cardGlow,
        borderWidth: 1,
        borderColor: c.cardBorder,
        borderRadius: 12,
        padding: 20,
      }}
    >
      {Icon && (
        <View style={{ marginBottom: 8 }}>
          <Icon size={18} color={c.textTertiary} strokeWidth={2} />
        </View>
      )}
      <Text style={{
        fontSize: 12, fontWeight: '700', color: c.textTertiary,
        textTransform: 'uppercase', letterSpacing: 1,
      }}>
        {label}
      </Text>
      <Text style={{ fontSize: 28, fontWeight: '700', color, marginTop: 8, marginBottom: 4 }}>
        {displayValue}
      </Text>
      <Text style={{ fontSize: 12, color: c.textTertiary }}>{sub}</Text>
    </Animated.View>
  )
}

// ── Animated Chart Wrapper (fade + slide + scale) ──
function AnimatedChartWrapper({ c, children }: { c: ThemeColors; children: React.ReactNode }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(600).springify().damping(14).stiffness(60)}
      style={{
        backgroundColor: c.cardGlow,
        borderWidth: 1,
        borderColor: c.cardBorder,
        borderRadius: 12,
        padding: 20,
      }}
    >
      {children}
    </Animated.View>
  )
}

// ── Animated Legend (fades in 200ms after chart) ──
function AnimatedLegend({ c }: { c: ThemeColors }) {
  return (
    <Animated.View entering={FadeIn.duration(400).delay(200)} style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c.primary }} />
        <Text style={{ fontSize: 12, color: c.textTertiary }}>Present</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{
          width: 12, height: 12, borderRadius: 2,
          backgroundColor: c.cardBorder,
        }} />
        <Text style={{ fontSize: 12, color: c.textTertiary }}>Absent</Text>
      </View>
    </Animated.View>
  )
}

// ── Mark Row (slides in from right with stagger) ──
function MarkRow({ m, c, index }: { m: any; c: ThemeColors; index: number }) {
  const pct = m.maxScore > 0 ? Math.round((m.score / m.maxScore) * 100) : 0

  return (
    <Animated.View
      entering={FadeInRight.duration(400).delay(index * 50)}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: c.inputBg, borderRadius: 8,
        paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: c.text }}>
          {m.subject.name}
        </Text>
        <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 2, textTransform: 'capitalize' }}>
          {m.assessmentType.replace(/_/g, ' ')}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{
          fontSize: 18, fontWeight: '700',
          color: pct >= 60 ? c.primary : c.error,
        }}>
          {m.score}/{m.maxScore}
        </Text>
        <Text style={{ fontSize: 11, color: c.textTertiary }}>{pct}%</Text>
      </View>
    </Animated.View>
  )
}

// ══════════════════════════════════════════════════════════
// ── Main Report Screen ──
// ══════════════════════════════════════════════════════════
export function ReportScreen() {
  const { c, spacing } = useTheme()
  const screenWidth = Dimensions.get('window').width - spacing.md * 4

  const chartConfig = {
    backgroundGradientFrom: c.surface,
    backgroundGradientTo: c.surface,
    color: (opacity = 1) => {
      // Extract RGB from c.primary for opacity support
      const hex = c.primary.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    },
    labelColor: () => c.textTertiary,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      stroke: c.borderLight,
    },
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['weeklyReport'],
    queryFn: getWeeklyReport,
  })

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }


  if (isLoading && !data) return <LoadingScreen />
  if (!data)
    return (
      <EmptyState
        icon="bar-chart"
        title="No report data"
        message="Weekly report is not available yet."
      />
    )

  // ── Chart data ──
  const dayLabels = data.dailyBreakdown.map((d: any) => {
    const date = new Date(d.date)
    return date.toLocaleDateString('en', { weekday: 'short' })
  })

  const attendanceData = data.dailyBreakdown.map((d: any) => (d.present ? 1 : 0))

  // ── Report cards data ──
  const reportCards = [
    {
      label: 'Attendance',
      value: `${data.attendance.percentage}%`,
      sub: `${data.attendance.present}/${data.attendance.total} classes`,
      color: data.attendance.percentage >= 75 ? '#4CAF50' : '#E53935',
    },
    {
      label: 'Spending',
      value: formatCurrency(data.spending.total),
      sub: `Food: ${formatCurrency(data.meals.totalSpend)}`,
      color: c.primary,
    },
    {
      label: 'Meals/Day',
      value:
        data.dailyBreakdown.length > 0
          ? (data.meals.count / Math.max(data.dailyBreakdown.length, 1)).toFixed(1)
          : '0',
      sub: `${data.meals.count} total`,
      color: c.primary,
    },
    {
      label: 'Fees Due',
      value: formatCurrency(data.fees.totalDue),
      sub: `${data.fees.pending} pending`,
      color: data.fees.totalDue > 0 ? '#E53935' : '#4CAF50',
    },
    {
      label: 'Check-ins',
      value: `${data.checkIns.count}`,
      sub: 'this week',
      color: c.primary,
    },
    {
      label: 'OD Trips',
      value: `${data.odTrips.count}`,
      sub: 'this week',
      color: c.primary,
    },
  ]

  // ── Generate summary paragraph ──
  function generateSummary() {
    const parts: string[] = []
    const { attendance, spending, meals, fees, checkIns, odTrips, marks } = data!

    if (attendance.total > 0) {
      if (attendance.percentage >= 85)
        parts.push(
          `Attendance is strong at ${attendance.percentage}% (${attendance.present}/${attendance.total} classes).`
        )
      else if (attendance.percentage >= 75)
        parts.push(
          `Attendance is at ${attendance.percentage}% (${attendance.present}/${attendance.total} classes) - needs improvement.`
        )
      else
        parts.push(
          `Attendance is concerning at ${attendance.percentage}% (${attendance.present}/${attendance.total} classes) - immediate attention needed.`
        )
    } else {
      parts.push('No attendance records this week.')
    }

    if (spending.total > 0)
      parts.push(`Total campus spending was ${formatCurrency(spending.total)}.`)
    if (meals.count > 0)
      parts.push(
        `${meals.count} meals logged, spending ${formatCurrency(meals.totalSpend)} on food.`
      )
    if (fees.totalDue > 0)
      parts.push(
        `${formatCurrency(fees.totalDue)} in fees pending across ${fees.pending} records.`
      )
    if (checkIns.count > 0)
      parts.push(`${checkIns.count} campus check-ins recorded.`)
    if (odTrips.count > 0) parts.push(`${odTrips.count} OD trip(s) this week.`)
    if (marks.length > 0)
      parts.push(`${marks.length} assessment result(s) published.`)

    return parts.join(' ')
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ padding: spacing.md, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={c.primary}
          colors={[c.primary]}
        />
      }
    >
      {/* ══════ HEADER ══════ */}
      <Animated.View entering={FadeIn.duration(500)} style={{ marginBottom: 8 }}>
        <LinearGradient
          colors={[c.headerGradientStart, c.headerGradientEnd]}
          style={{ paddingHorizontal: 4, paddingVertical: 4, borderRadius: 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <FileText size={22} color={c.primary} strokeWidth={2} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: c.primary }}>
              Weekly Report
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: c.textTertiary, marginTop: 4 }}>
            {formatDate(data.weekStart)} - {formatDate(data.weekEnd)}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* ══════ REPORT CARDS GRID ══════ */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {reportCards.map((card, i) => (
          <MetricCard
            key={i}
            label={card.label}
            value={card.value}
            sub={card.sub}
            color={card.color}
            c={c}
            index={i}
          />
        ))}
      </View>

      {/* ══════ DAILY ATTENDANCE CHART ══════ */}
      {data.dailyBreakdown.length > 0 && (
        <AnimatedChartWrapper c={c}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: c.primary, marginBottom: 16 }}>
            Daily Attendance
          </Text>
          <BarChart
            data={{
              labels: dayLabels,
              datasets: [
                { data: attendanceData.length > 0 ? attendanceData : [0] },
              ],
            }}
            width={screenWidth}
            height={200}
            chartConfig={chartConfig}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            style={{ borderRadius: 12 }}
          />
          {/* Legend - fades in 200ms after chart */}
          <AnimatedLegend c={c} />
        </AnimatedChartWrapper>
      )}

      {/* ══════ MARKS PUBLISHED ══════ */}
      {data.marks.length > 0 && (
        <View style={{
          backgroundColor: c.cardGlow, borderWidth: 1,
          borderColor: c.cardBorder, borderRadius: 12, padding: 20,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: c.primary, marginBottom: 16 }}>
            Marks Published This Week
          </Text>
          {data.marks.map((m: any, idx: number) => (
            <MarkRow key={m.id} m={m} c={c} index={idx} />
          ))}
        </View>
      )}

      {/* ══════ WEEK SUMMARY ══════ */}
      <View style={{
        backgroundColor: c.cardGlow, borderWidth: 1,
        borderColor: c.cardBorder, borderRadius: 12, padding: 20,
      }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: c.primary, marginBottom: 16 }}>
          Week Summary
        </Text>
        <Text style={{ fontSize: 14, color: c.text, opacity: 0.85, lineHeight: 24 }}>
          {generateSummary()}
        </Text>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}
