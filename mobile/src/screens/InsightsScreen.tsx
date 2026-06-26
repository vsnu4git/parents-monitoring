import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import {
  Brain,
  Shield,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react-native'
import { getInsights } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import { formatCurrency } from '../utils/format'
import type { ThemeColors } from '../theme'

// ── Severity / insight type style map (theme-aware) ──
function getTypeStyles(c: ThemeColors): Record<string, { bg: string; border: string }> {
  return {
    critical: { bg: c.dangerBg, border: c.dangerBorder },
    danger: { bg: c.dangerBg, border: c.dangerBorder },
    warning: { bg: c.warningLight, border: c.warningBorder },
    positive: { bg: c.successLight, border: c.successBorder },
    info: { bg: c.surfaceVariant, border: c.borderLight },
  }
}

function getTrustColor(score: number) {
  if (score >= 80) return '#4CAF50'
  if (score >= 60) return '#FAFAFA'
  if (score >= 40) return '#FF9800'
  return '#E53935'
}

function getTrustLevel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good Standing'
  if (score >= 40) return 'Needs Attention'
  return 'Concerning'
}

function getTrustDescription(score: number) {
  if (score >= 80) return 'Maximum autonomy earned'
  if (score >= 60) return 'Good standing'
  if (score >= 40) return 'Some concerns detected'
  return 'Close monitoring recommended'
}

// ── Severity icon component ──
function SeverityIcon({ type, color, size = 18 }: { type: string; color: string; size?: number }) {
  const props = { size, color, strokeWidth: 2 }
  switch (type) {
    case 'critical':
    case 'danger':
      return <AlertTriangle {...props} />
    case 'warning':
      return <AlertCircle {...props} />
    case 'positive':
      return <CheckCircle {...props} />
    default:
      return <Info {...props} />
  }
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
        const c1 = 1.70158; const c3i = c1 + 1
      const eased = Math.min(1, Math.max(0, 1 + c3i * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)))
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

// ── Trust Score Donut Ring ──
function TrustScoreRing({ score, c }: { score: number; c: ThemeColors }) {
  const color = getTrustColor(score)
  const size = 140
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Animate arc from 0 to target over ~1000ms with easeOutCubic
  const [arcProgress, setArcProgress] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const duration = 1000
    let frame: number
    const animate = () => {
      const elapsed = Date.now() - start
      const t = Math.min(elapsed / duration, 1)
      const c1 = 1.70158; const c3i = c1 + 1
      const eased = Math.min(1, Math.max(0, 1 + c3i * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2))) // easeOutCubic
      setArcProgress(eased * score)
      if (t < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const progress = (arcProgress / 100) * circumference

  // Count up the center score number
  const displayScore = useCountUp(score, 1000, 0)

  return (
    <Animated.View entering={FadeInDown.duration(600).springify().damping(12).stiffness(80)} style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={c.surfaceVariant}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Score arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${progress} ${circumference - progress}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        {/* Center text overlay */}
        <View style={ringStyles.centerOverlay}>
          <Text style={[ringStyles.scoreText, { color, textShadowColor: `${color}40`, textShadowRadius: 30 }]}>
            {displayScore}
          </Text>
          <Text style={[ringStyles.trustLabel, { color: c.textDim }]}>TRUST</Text>
        </View>
      </View>
      <Text style={[ringStyles.levelText, { color }]}>{getTrustLevel(score)}</Text>
      <Text style={[ringStyles.descriptionText, { color: c.textDark }]}>{getTrustDescription(score)}</Text>
    </Animated.View>
  )
}

const ringStyles = StyleSheet.create({
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '900',
  },
  trustLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 10,
    marginTop: 2,
  },
})

// ── Comparison Pill ──
function ComparisonPill({
  label,
  thisWeek,
  lastWeek,
  format: fmt,
  c,
  index = 0,
}: {
  label: string
  thisWeek: number
  lastWeek: number
  format?: 'pct' | 'currency' | 'count'
  c: ThemeColors
  index?: number
}) {
  const diff = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0
  const isUp = diff > 0
  const isDown = diff < 0
  const isSpending = label === 'Spending'
  const trendColor =
    diff === 0 ? c.textDim : isSpending ? (isUp ? '#E53935' : '#4CAF50') : isUp ? '#4CAF50' : '#E53935'

  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

  // Count up the thisWeek value
  const animatedThisWeek = useCountUp(thisWeek, 800, index * 100 + 200)
  // Count up the trend diff value
  const animatedDiff = useCountUp(Math.abs(diff), 600, index * 100 + 400)

  const formatVal = (v: number) => {
    if (fmt === 'pct') return v >= 0 ? `${v}%` : '\u2014'
    if (fmt === 'currency') return `\u20B9${v}`
    return `${v}`
  }

  const EnterAnimation = index % 2 === 0 ? FadeInLeft : FadeInRight

  return (
    <Animated.View
      entering={EnterAnimation.duration(400).delay(index * 100).springify().damping(14).stiffness(60)}
      style={{
        flex: 1,
        backgroundColor: c.cardAlt,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', color: c.textDark, textTransform: 'uppercase', letterSpacing: 2 }}>
          {label}
        </Text>
        {diff !== 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <TrendIcon size={12} color={trendColor} strokeWidth={2} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: trendColor }}>
              {animatedDiff}%
            </Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: c.text }}>{formatVal(animatedThisWeek)}</Text>
        <Text style={{ fontSize: 10, color: c.textDarkest }}>vs {formatVal(lastWeek)}</Text>
      </View>
    </Animated.View>
  )
}

// ── Insight Card ──
function InsightCard({
  insight,
  c,
  typeStyles,
}: {
  insight: { type?: string; severity?: string; icon?: string; title: string; description?: string; detail?: string }
  c: ThemeColors
  typeStyles: Record<string, { bg: string; border: string }>
}) {
  const typeKey = insight.type || insight.severity || 'info'
  const style = typeStyles[typeKey] || typeStyles.info

  const severityColor =
    typeKey === 'critical' || typeKey === 'danger'
      ? c.error
      : typeKey === 'warning'
        ? c.warning
        : typeKey === 'positive'
          ? c.success
          : c.primary

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        marginHorizontal: 16,
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
    >
      <View style={{ marginTop: 2 }}>
        <SeverityIcon type={typeKey} color={severityColor} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{insight.title}</Text>
        <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 4, lineHeight: 18 }}>
          {insight.detail || insight.description}
        </Text>
      </View>
    </Animated.View>
  )
}

// ── Trust Score Rules ──
const TRUST_RULES = [
  { label: 'Attendance above 85%', effect: '+15', color: '#4CAF50' },
  { label: 'No missed OD destinations', effect: '+10', color: '#4CAF50' },
  { label: 'Regular check-ins', effect: '+10', color: '#4CAF50' },
  { label: 'Proper meal habits', effect: '+5', color: '#4CAF50' },
  { label: 'No overdue fees', effect: '+5', color: '#4CAF50' },
  { label: 'Missed OD destination', effect: '-15', color: '#E53935' },
  { label: 'Attendance below 75%', effect: '-10', color: '#E53935' },
  { label: 'Frequent missed check-ins', effect: '-10', color: '#E53935' },
]

// ══════════════════════════════════════════════════════════
// ── Main Insights Screen ──
// ══════════════════════════════════════════════════════════
export function InsightsScreen() {
  const { c, spacing } = useTheme()
  const typeStyles = getTypeStyles(c)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['insights'],
    queryFn: getInsights,
  })

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }


  if (isLoading && !data) return <LoadingScreen />
  if (!data) return <EmptyState icon="lightbulb" title="No insights available" />

  const { insights, trustScore, weekComparison } = data

  // Categorize insights
  const dangers = insights.filter((i: any) => i.severity === 'critical' || i.severity === 'danger' || i.type === 'danger')
  const warnings = insights.filter((i: any) => i.severity === 'warning' || i.type === 'warning')
  const positives = insights.filter((i: any) => i.severity === 'positive' || i.type === 'positive')
  const infos = insights.filter((i: any) => i.severity === 'info' || i.type === 'info')

  const dangerCount = dangers.length
  const warningCount = warnings.length
  const positiveCount = positives.length

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
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
      <Animated.View entering={FadeIn.duration(500)}>
        <LinearGradient
          colors={[c.headerGradientStart, c.headerGradientEnd]}
          style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Brain size={20} color={c.primary} strokeWidth={2} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: c.textTertiary, letterSpacing: 3, textTransform: 'uppercase' }}>
              INSIGHT ENGINE
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: c.text }}>
            Weekly Intelligence
          </Text>
          <Text style={{ fontSize: 12, color: c.textDark, marginTop: 2 }}>
            Auto-analyzed behavioral patterns
          </Text>

          {/* Summary pills */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            {dangerCount > 0 && (
              <View style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                borderWidth: 1, backgroundColor: c.dangerBg, borderColor: c.dangerBorder,
              }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: c.error }}>
                  {dangerCount} critical
                </Text>
              </View>
            )}
            {warningCount > 0 && (
              <View style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                borderWidth: 1, backgroundColor: c.warningLight, borderColor: c.warningBorder,
              }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: c.warning }}>
                  {warningCount} warning{warningCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {positiveCount > 0 && (
              <View style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                borderWidth: 1, backgroundColor: c.successLight, borderColor: c.successBorder,
              }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: c.success }}>
                  {positiveCount} positive
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ══════ TRUST SCORE ══════ */}
      <View style={{
        backgroundColor: c.surface,
        borderWidth: 1, borderColor: c.border, borderRadius: 16,
        padding: 20, marginHorizontal: 16, marginTop: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Shield size={16} color={c.primary} strokeWidth={2} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: c.textTertiary, letterSpacing: 2, textTransform: 'uppercase' }}>
            TRUST SCORE
          </Text>
        </View>
        <TrustScoreRing score={trustScore.score ?? trustScore} c={c} />
      </View>

      {/* ══════ WEEK vs LAST ══════ */}
      <View style={{
        backgroundColor: c.surface,
        borderWidth: 1, borderColor: c.border, borderRadius: 16,
        padding: 20, marginHorizontal: 16, marginTop: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sparkles size={16} color={c.primary} strokeWidth={2} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: c.textTertiary, letterSpacing: 2, textTransform: 'uppercase' }}>
            THIS WEEK VS LAST
          </Text>
        </View>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ComparisonPill label="Attendance" thisWeek={weekComparison.attendance.thisWeek} lastWeek={weekComparison.attendance.lastWeek} format="pct" c={c} index={0} />
            <ComparisonPill label="Meals" thisWeek={weekComparison.meals.thisWeek} lastWeek={weekComparison.meals.lastWeek} format="count" c={c} index={1} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ComparisonPill label="Spending" thisWeek={weekComparison.spending.thisWeek} lastWeek={weekComparison.spending.lastWeek} format="currency" c={c} index={2} />
            <ComparisonPill label="Check-ins" thisWeek={weekComparison.checkIns.thisWeek} lastWeek={weekComparison.checkIns.lastWeek} format="count" c={c} index={3} />
          </View>
        </View>
      </View>

      {/* ══════ CRITICAL / DANGER INSIGHTS ══════ */}
      {dangers.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{
            fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 8, paddingHorizontal: 20, color: c.error,
          }}>
            Needs Immediate Attention
          </Text>
          {dangers.map((insight: any, i: number) => (
            <InsightCard key={`d-${i}`} insight={insight} c={c} typeStyles={typeStyles} />
          ))}
        </View>
      )}

      {/* ══════ WARNINGS ══════ */}
      {warnings.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{
            fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 8, paddingHorizontal: 20, color: c.warning,
          }}>
            Watch Out
          </Text>
          {warnings.map((insight: any, i: number) => (
            <InsightCard key={`w-${i}`} insight={insight} c={c} typeStyles={typeStyles} />
          ))}
        </View>
      )}

      {/* ══════ POSITIVE ══════ */}
      {positives.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{
            fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 8, paddingHorizontal: 20, color: c.success,
          }}>
            Going Well
          </Text>
          {positives.map((insight: any, i: number) => (
            <InsightCard key={`p-${i}`} insight={insight} c={c} typeStyles={typeStyles} />
          ))}
        </View>
      )}

      {/* ══════ INFO ══════ */}
      {infos.length > 0 && (
        <View style={{ marginTop: 16 }}>
          {infos.map((insight: any, i: number) => (
            <InsightCard key={`i-${i}`} insight={insight} c={c} typeStyles={typeStyles} />
          ))}
        </View>
      )}

      {/* ══════ HOW TRUST SCORE WORKS ══════ */}
      <View style={{
        backgroundColor: c.cardAlt,
        borderWidth: 1, borderColor: c.border, borderRadius: 16,
        padding: 16, marginHorizontal: 16, marginTop: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Shield size={14} color={c.textDark} strokeWidth={2} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: c.textDark, letterSpacing: 2, textTransform: 'uppercase' }}>
            HOW TRUST SCORE WORKS
          </Text>
        </View>
        {TRUST_RULES.map((rule, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: c.textTertiary }}>{rule.label}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', fontFamily: 'monospace', color: rule.color }}>
              {rule.effect}
            </Text>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: c.border, marginTop: 12 }} />
        <Text style={{ fontSize: 9, color: c.textDarkest, marginTop: 8, lineHeight: 14 }}>
          Higher trust score = more autonomy for the student. Score updates weekly based on behavior patterns.
        </Text>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}
