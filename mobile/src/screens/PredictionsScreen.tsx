import React, { useState } from 'react'
import {
  View, Text, ScrollView, RefreshControl, Dimensions,
} from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Line, Circle as SvgCircle, Text as SvgText, Rect } from 'react-native-svg'
import {
  TrendingUp, TrendingDown, Minus, BarChart3, DollarSign,
  UtensilsCrossed, GraduationCap, AlertTriangle, CheckCircle, Clock,
} from 'lucide-react-native'
import { getPredictions } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import type { PredictionPoint, PredictionsResponse } from '../types/api'

const CHART_W = Dimensions.get('window').width - 72
const CHART_H = 140
const CHART_PADDING = 24

function MiniLineChart({ dataPoints, color, c }: {
  dataPoints: PredictionPoint[]; color: string; c: any
}) {
  if (!dataPoints || dataPoints.length < 2) return null

  const values = dataPoints.map(d => d.value)
  const minVal = Math.min(...values) * 0.9
  const maxVal = Math.max(...values) * 1.1
  const range = maxVal - minVal || 1

  const getX = (i: number) => CHART_PADDING + (i / (dataPoints.length - 1)) * (CHART_W - CHART_PADDING * 2)
  const getY = (v: number) => CHART_H - CHART_PADDING - ((v - minVal) / range) * (CHART_H - CHART_PADDING * 2)

  // Split into actual and forecast segments
  const lastActualIdx = dataPoints.findIndex(d => d.isForecast) - 1
  const splitIdx = lastActualIdx >= 0 ? lastActualIdx : dataPoints.length - 1

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = CHART_PADDING + pct * (CHART_H - CHART_PADDING * 2)
        return (
          <Line key={`g${i}`} x1={CHART_PADDING} y1={y} x2={CHART_W - CHART_PADDING} y2={y}
            stroke={c.borderLight} strokeWidth={1} strokeDasharray="4,4" />
        )
      })}

      {/* Actual line (solid) */}
      {dataPoints.slice(0, splitIdx + 1).map((d, i) => {
        if (i === 0) return null
        const prev = dataPoints[i - 1]
        return (
          <Line key={`a${i}`}
            x1={getX(i - 1)} y1={getY(prev.value)}
            x2={getX(i)} y2={getY(d.value)}
            stroke={color} strokeWidth={2.5} strokeLinecap="round"
          />
        )
      })}

      {/* Forecast line (dashed) */}
      {dataPoints.slice(splitIdx).map((d, i) => {
        if (i === 0) return null
        const prev = dataPoints[splitIdx + i - 1]
        return (
          <Line key={`f${i}`}
            x1={getX(splitIdx + i - 1)} y1={getY(prev.value)}
            x2={getX(splitIdx + i)} y2={getY(d.value)}
            stroke={color} strokeWidth={2} strokeLinecap="round"
            strokeDasharray="6,4" opacity={0.7}
          />
        )
      })}

      {/* Data points */}
      {dataPoints.map((d, i) => (
        <SvgCircle key={`c${i}`}
          cx={getX(i)} cy={getY(d.value)} r={d.isForecast ? 3 : 4}
          fill={d.isForecast ? 'transparent' : color}
          stroke={color} strokeWidth={d.isForecast ? 1.5 : 0}
        />
      ))}

      {/* Labels */}
      {dataPoints.filter((_, i) => i % Math.max(1, Math.floor(dataPoints.length / 5)) === 0 || i === dataPoints.length - 1).map((d, i) => {
        const idx = dataPoints.indexOf(d)
        return (
          <SvgText key={`l${i}`}
            x={getX(idx)} y={CHART_H - 4}
            textAnchor="middle" fontSize={8} fill={c.textMuted}
          >
            {d.label}
          </SvgText>
        )
      })}
    </Svg>
  )
}

function TrendBadge({ trend, c }: { trend: string; c: any }) {
  const isUp = trend === 'up' || trend === 'increasing'
  const isDown = trend === 'down' || trend === 'decreasing'
  const color = isUp ? c.success : isDown ? c.error : c.textMuted
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon size={14} color={color} strokeWidth={2} />
      <Text style={{ fontSize: 10, fontWeight: '700', color, textTransform: 'capitalize' }}>{trend}</Text>
    </View>
  )
}

function StatCard({ label, current, predicted, unit, c }: {
  label: string; current: number; predicted: number; unit?: string; c: any
}) {
  const diff = predicted - current
  const isPositive = diff >= 0
  return (
    <View style={{
      flex: 1, backgroundColor: c.surface, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, padding: 14, alignItems: 'center',
    }}>
      <Text style={{ fontSize: 8, fontWeight: '700', color: c.textTertiary, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: '900', color: c.primary, marginTop: 4 }}>
        {current}{unit || ''}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
        {isPositive ? <TrendingUp size={10} color={c.success} /> : <TrendingDown size={10} color={c.error} />}
        <Text style={{ fontSize: 10, fontWeight: '700', color: isPositive ? c.success : c.error }}>
          {isPositive ? '+' : ''}{diff.toFixed(1)}{unit || ''} predicted
        </Text>
      </View>
    </View>
  )
}

function getRiskColor(riskLevel: string, c: any) {
  switch (riskLevel) {
    case 'low': return { bg: c.successLight, border: c.successBorder, text: c.success, icon: CheckCircle }
    case 'medium': return { bg: c.warningLight, border: c.warningBorder, text: c.warning, icon: AlertTriangle }
    case 'high': return { bg: c.errorLight, border: c.dangerBorder, text: c.error, icon: AlertTriangle }
    default: return { bg: c.surfaceVariant, border: c.borderLight, text: c.textMuted, icon: Minus }
  }
}

export function PredictionsScreen() {
  const { c, spacing } = useTheme()
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['predictions'],
    queryFn: getPredictions,
  })

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false) }


  if (isLoading && !data) return <LoadingScreen />
  if (!data) return <EmptyState icon="chart" title="No predictions available" message="Check back later for forecasts" />

  const { attendance, gpa, fees, meals } = data
  const feeRisk = getRiskColor(fees.riskLevel, c)
  const FeeIcon = feeRisk.icon

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
    >
      {/* Header */}
      <Animated.View entering={FadeIn.duration(500)}>
        <LinearGradient
          colors={[c.headerGradientStart, c.headerGradientEnd]}
          style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TrendingUp size={20} color={c.primary} strokeWidth={2} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: c.textTertiary, letterSpacing: 3, textTransform: 'uppercase' }}>
              PREDICTIONS
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: c.text }}>
            Forecast Dashboard
          </Text>
          <Text style={{ fontSize: 12, color: c.textDark, marginTop: 2 }}>
            AI-powered predictions for your child
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Quick Stats */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: spacing.md, marginTop: spacing.md }}>
        <StatCard label="Attendance" current={attendance.current} predicted={attendance.predicted} unit="%" c={c} />
        <StatCard label="GPA" current={gpa.current} predicted={gpa.predicted} c={c} />
      </View>

      {/* Attendance Forecast Chart */}
      <View style={{
        backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16,
        padding: 16, marginHorizontal: spacing.md, marginTop: spacing.md,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color={c.primary} strokeWidth={2} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: c.textTertiary, letterSpacing: 2, textTransform: 'uppercase' }}>
              ATTENDANCE FORECAST
            </Text>
          </View>
          <TrendBadge trend={attendance.trend} c={c} />
        </View>
        <MiniLineChart dataPoints={attendance.dataPoints} color={c.primary} c={c} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 16, height: 2, backgroundColor: c.primary, borderRadius: 1 }} />
            <Text style={{ fontSize: 9, color: c.textMuted }}>Actual</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 16, height: 2, backgroundColor: c.primary, borderRadius: 1, opacity: 0.5 }}>
              <View style={{ position: 'absolute', left: 0, width: 6, height: 2, backgroundColor: c.primary, borderRadius: 1 }} />
              <View style={{ position: 'absolute', left: 10, width: 6, height: 2, backgroundColor: c.primary, borderRadius: 1 }} />
            </View>
            <Text style={{ fontSize: 9, color: c.textMuted }}>Forecast</Text>
          </View>
        </View>
        <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 8, lineHeight: 16 }}>
          Based on current patterns, attendance is predicted to {attendance.predicted >= attendance.current ? 'improve' : 'decline'} to {attendance.predicted}% by end of semester.
        </Text>
      </View>

      {/* GPA Prediction */}
      <View style={{
        backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16,
        padding: 16, marginHorizontal: spacing.md, marginTop: spacing.md,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <GraduationCap size={16} color={c.primary} strokeWidth={2} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: c.textTertiary, letterSpacing: 2, textTransform: 'uppercase' }}>
            GPA PREDICTION
          </Text>
        </View>

        {/* Visual meter */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 11, color: c.textMuted }}>Current</Text>
            <Text style={{ fontSize: 11, color: c.textMuted }}>Predicted</Text>
          </View>
          <View style={{ height: 24, backgroundColor: c.borderLight, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
            {/* Current bar */}
            <View style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${(gpa.current / 10) * 100}%` as any,
              backgroundColor: c.primary, borderRadius: 12,
            }} />
            {/* Predicted marker */}
            <View style={{
              position: 'absolute', top: -2, bottom: -2,
              left: `${(gpa.predicted / 10) * 100}%` as any,
              width: 3, backgroundColor: c.success, borderRadius: 2,
              marginLeft: -1.5,
            }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: c.primary }}>{gpa.current.toFixed(2)}</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: c.success }}>{gpa.predicted.toFixed(2)}</Text>
          </View>
        </View>

        {gpa.dataPoints && gpa.dataPoints.length >= 2 && (
          <MiniLineChart dataPoints={gpa.dataPoints} color={c.success} c={c} />
        )}

        <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 8, lineHeight: 16 }}>
          GPA is expected to {gpa.predicted >= gpa.current ? 'increase' : 'decrease'} from {gpa.current.toFixed(2)} to {gpa.predicted.toFixed(2)} based on current performance trends.
        </Text>
      </View>

      {/* Fee Status */}
      <View style={{
        backgroundColor: feeRisk.bg, borderWidth: 1, borderColor: feeRisk.border, borderRadius: 16,
        padding: 16, marginHorizontal: spacing.md, marginTop: spacing.md,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <DollarSign size={16} color={feeRisk.text} strokeWidth={2} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: c.textTertiary, letterSpacing: 2, textTransform: 'uppercase' }}>
            FEE STATUS
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: feeRisk.text + '15', alignItems: 'center', justifyContent: 'center',
          }}>
            <FeeIcon size={24} color={feeRisk.text} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.text, textTransform: 'capitalize' }}>{fees.status}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: feeRisk.text, textTransform: 'uppercase' }}>
                Risk: {fees.riskLevel}
              </Text>
            </View>
            {fees.nextDueDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Clock size={10} color={c.textMuted} />
                <Text style={{ fontSize: 11, color: c.textSecondary }}>
                  Next due: {new Date(fees.nextDueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Meal Regularity */}
      <View style={{
        backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16,
        padding: 16, marginHorizontal: spacing.md, marginTop: spacing.md,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UtensilsCrossed size={16} color={c.primary} strokeWidth={2} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: c.textTertiary, letterSpacing: 2, textTransform: 'uppercase' }}>
              MEAL REGULARITY
            </Text>
          </View>
          <TrendBadge trend={meals.trend} c={c} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: c.cardAlt, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, fontWeight: '700', color: c.textTertiary, letterSpacing: 1 }}>CURRENT AVG</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: c.text, marginTop: 4 }}>{meals.currentAvg.toFixed(1)}</Text>
            <Text style={{ fontSize: 9, color: c.textMuted }}>meals/day</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c.cardAlt, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, fontWeight: '700', color: c.textTertiary, letterSpacing: 1 }}>PREDICTED AVG</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: meals.predictedAvg >= meals.currentAvg ? c.success : c.error, marginTop: 4 }}>
              {meals.predictedAvg.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 9, color: c.textMuted }}>meals/day</Text>
          </View>
        </View>

        {meals.dataPoints && meals.dataPoints.length >= 2 && (
          <MiniLineChart dataPoints={meals.dataPoints} color="#FF9800" c={c} />
        )}

        <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 8, lineHeight: 16 }}>
          Meal intake is {meals.trend === 'up' || meals.trend === 'increasing' ? 'improving' : meals.trend === 'stable' ? 'stable' : 'declining'}. Average is predicted to be {meals.predictedAvg.toFixed(1)} meals/day next week.
        </Text>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}
