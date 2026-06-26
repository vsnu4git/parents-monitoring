import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Svg, { Path, Circle } from 'react-native-svg'
import { getProfile, getFees, acknowledgeFee } from '../api/endpoints'
import { StudentSelector } from '../components/StudentSelector'
import { Card } from '../components/Card'
import { StatusChip } from '../components/StatusChip'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import { formatCurrency, formatDate } from '../utils/format'
import Animated, { FadeInDown } from 'react-native-reanimated'

// ── Donut Chart ────────────────────────────────────────────────
interface DonutSegment {
  label: string
  value: number
  color: string
}

// easeOutCubic easing function
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function FeeDonutChart({
  segments,
  size = 160,
  strokeWidth = 24,
}: {
  segments: DonutSegment[]
  size?: number
  strokeWidth?: number
}) {
  const { c } = useTheme()
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius

  const total = segments.reduce((s, seg) => s + seg.value, 0)

  // Sweep-in animation: progress goes from 0 to 1 over ~800ms with easeOutCubic
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) startTimeRef.current = timestamp
    const elapsed = timestamp - startTimeRef.current
    const duration = 800
    const raw = Math.min(elapsed / duration, 1)
    const eased = easeOutCubic(raw)
    setProgress(eased)
    if (raw < 1) {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [])

  useEffect(() => {
    if (total === 0) return
    startTimeRef.current = null
    setProgress(0)
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [total, animate])

  if (total === 0) return null

  let cumulativeAngle = -90 // start from top

  const arcs = segments.map((seg) => {
    const fullAngle = (seg.value / total) * 360
    const angle = fullAngle * progress
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + angle
    cumulativeAngle = cumulativeAngle + fullAngle * progress

    if (angle < 0.1) return { d: '', color: seg.color, key: seg.label, visible: false }

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
    return { d, color: seg.color, key: seg.label, visible: true }
  })

  return (
    <Svg width={size} height={size}>
      {/* Background track */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={c.border}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Segments */}
      {arcs.map((arc) =>
        arc.visible ? (
          <Path
            key={arc.key}
            d={arc.d}
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            fill="none"
          />
        ) : null
      )}
    </Svg>
  )
}

// ── Main Screen ────────────────────────────────────────────────
export function FeesScreen() {
  const { c, spacing } = useTheme()
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const queryClient = useQueryClient()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const studentId = selectedStudentId || profile?.students[0]?.id || ''

  const { data: fees, isLoading, refetch } = useQuery({
    queryKey: ['fees', studentId],
    queryFn: () => getFees(studentId),
    enabled: !!studentId,
  })

  const ackMutation = useMutation({
    mutationFn: acknowledgeFee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', studentId] })
      Alert.alert('Success', 'Fee acknowledged')
    },
  })

  // ── Derived data ──
  const totalPaid = fees?.reduce((sum, f) => sum + f.paidAmount, 0) ?? 0
  const totalDue = fees?.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0) ?? 0
  const overdueFees = fees?.filter((f) => f.status === 'OVERDUE') ?? []
  const pendingAmount =
    fees
      ?.filter((f) => f.status === 'PENDING' || f.status === 'PARTIAL')
      .reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0) ?? 0
  const overdueAmount = overdueFees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0)

  const chartSegments: DonutSegment[] = [
    { label: 'Paid', value: totalPaid, color: '#4CAF50' },
    { label: 'Pending', value: pendingAmount, color: '#FF9800' },
    { label: 'Overdue', value: overdueAmount, color: '#E53935' },
  ].filter((s) => s.value > 0)

  const pending = fees?.filter((f) => ['PENDING', 'OVERDUE', 'PARTIAL'].includes(f.status)) || []
  const paid = fees?.filter((f) => ['PAID', 'WAIVED'].includes(f.status)) || []

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        content: { padding: spacing.md, gap: spacing.md },

        // Summary cards row
        summaryRow: {
          flexDirection: 'row',
          gap: spacing.sm,
        },
        summaryCard: {
          flex: 1,
          backgroundColor: c.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.border,
          paddingVertical: 12,
          alignItems: 'center',
        },
        summaryLabel: {
          fontSize: 10,
          color: c.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 4,
        },
        summaryValue: { fontSize: 15, fontWeight: '700' },

        // Donut chart card
        chartCard: {
          backgroundColor: c.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: c.border,
          paddingVertical: 16,
          alignItems: 'center',
        },
        chartTitle: {
          fontSize: 10,
          color: c.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 12,
        },
        legendRow: {
          flexDirection: 'row',
          marginTop: 12,
          gap: 16,
        },
        legendItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        legendDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
        },
        legendLabel: {
          fontSize: 10,
          color: c.textSecondary,
        },

        // Section title
        sectionTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: spacing.sm },

        // Fee cards
        feeCard: { marginBottom: spacing.sm },
        feeHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        feeDesc: { fontSize: 15, fontWeight: '600', color: c.text },
        feeTerm: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        feeDetails: {
          flexDirection: 'row',
          marginTop: spacing.md,
          gap: spacing.lg,
        },
        feeDetailItem: {},
        feeLabel: { fontSize: 11, color: c.textSecondary },
        feeValue: { fontSize: 16, fontWeight: '700', color: c.text, marginTop: 2 },
        dueDate: { fontSize: 12, color: c.textSecondary, marginTop: spacing.sm },
        ackButton: {
          backgroundColor: c.primary,
          borderRadius: 8,
          paddingVertical: 10,
          alignItems: 'center',
          marginTop: spacing.md,
        },
        ackText: { color: c.buttonText, fontWeight: '600', fontSize: 14 },
      }),
    [c, spacing],
  )

  if (profileLoading) return <LoadingScreen />
  if (!profile?.students.length) return <EmptyState icon="graduation" title="No students linked" />

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)}>
        <StudentSelector
          students={profile.students}
          selectedId={studentId}
          onSelect={setSelectedStudentId}
        />
      </Animated.View>

      {isLoading ? (
        <LoadingScreen />
      ) : fees && fees.length > 0 ? (
        <>
          {/* ── Summary Cards ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)} style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Paid</Text>
              <Text style={[styles.summaryValue, { color: c.success }]}>
                {formatCurrency(totalPaid)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Due</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: totalDue > 0 ? c.error : c.success },
                ]}
              >
                {totalDue > 0 ? formatCurrency(totalDue) : 'Clear'}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Overdue</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: overdueFees.length > 0 ? c.error : c.textMuted },
                ]}
              >
                {overdueFees.length}
              </Text>
            </View>
          </Animated.View>

          {/* ── Fee Breakdown Donut Chart ── */}
          {chartSegments.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(120).springify().damping(18).stiffness(180)} style={styles.chartCard}>
              <Text style={styles.chartTitle}>Fee Breakdown</Text>
              <FeeDonutChart segments={chartSegments} size={160} strokeWidth={24} />
              <View style={styles.legendRow}>
                {chartSegments.map((seg) => (
                  <View key={seg.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                    <Text style={styles.legendLabel}>{seg.label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── Pending / Due ── */}
          {pending.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(180).springify().damping(18).stiffness(180)}>
              <Text style={styles.sectionTitle}>Pending / Due</Text>
              {pending.map((fee) => (
                <Card key={fee.id} style={styles.feeCard}>
                  <View style={styles.feeHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feeDesc}>{fee.description}</Text>
                      <Text style={styles.feeTerm}>{fee.term}</Text>
                    </View>
                    <StatusChip status={fee.status} />
                  </View>
                  <View style={styles.feeDetails}>
                    <View style={styles.feeDetailItem}>
                      <Text style={styles.feeLabel}>Total</Text>
                      <Text style={styles.feeValue}>{formatCurrency(fee.totalAmount)}</Text>
                    </View>
                    <View style={styles.feeDetailItem}>
                      <Text style={styles.feeLabel}>Paid</Text>
                      <Text style={[styles.feeValue, { color: c.success }]}>
                        {formatCurrency(fee.paidAmount)}
                      </Text>
                    </View>
                    <View style={styles.feeDetailItem}>
                      <Text style={styles.feeLabel}>Due</Text>
                      <Text style={[styles.feeValue, { color: c.error }]}>
                        {formatCurrency(fee.totalAmount - fee.paidAmount)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dueDate}>Due: {formatDate(fee.dueDate)}</Text>
                  {(!fee.acknowledgements || fee.acknowledgements.length === 0) && (
                    <TouchableOpacity
                      style={styles.ackButton}
                      onPress={() => ackMutation.mutate(fee.id)}
                      disabled={ackMutation.isPending}
                    >
                      <Text style={styles.ackText}>Acknowledge</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              ))}
            </Animated.View>
          )}

          {/* ── Paid / Waived ── */}
          {paid.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(240).springify().damping(18).stiffness(180)}>
              <Text style={styles.sectionTitle}>Paid / Waived</Text>
              {paid.map((fee) => (
                <Card key={fee.id} style={styles.feeCard}>
                  <View style={styles.feeHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feeDesc}>{fee.description}</Text>
                      <Text style={styles.feeTerm}>{fee.term}</Text>
                    </View>
                    <StatusChip status={fee.status} />
                  </View>
                  <View style={styles.feeDetails}>
                    <View style={styles.feeDetailItem}>
                      <Text style={styles.feeLabel}>Amount</Text>
                      <Text style={styles.feeValue}>{formatCurrency(fee.totalAmount)}</Text>
                    </View>
                  </View>
                  {fee.paidAt && <Text style={styles.dueDate}>Paid: {formatDate(fee.paidAt)}</Text>}
                </Card>
              ))}
            </Animated.View>
          )}
        </>
      ) : (
        <EmptyState icon="wallet" title="No fee records" />
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}
