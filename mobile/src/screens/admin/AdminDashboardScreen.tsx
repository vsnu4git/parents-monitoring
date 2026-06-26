import React, { useMemo, useCallback, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  GraduationCap,
  UserCheck,
  Ticket,
  CalendarCheck,
  DollarSign,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react-native'
import { getAdminDashboard } from '../../api/endpoints'
import { useAuth } from '../../auth/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { LoadingScreen } from '../../components/LoadingScreen'
import { formatCurrency } from '../../utils/format'

export function AdminDashboardScreen() {
  const { user } = useAuth()
  const { c, spacing } = useTheme()
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const firstName = user?.name?.split(' ')[0] ?? 'Admin'

  const attendancePercent = useMemo(() => {
    if (!data?.attendanceSummary?.total) return 0
    return Math.round(
      (data.attendanceSummary.present / data.attendanceSummary.total) * 100
    )
  }, [data?.attendanceSummary])

  const revenuePercent = useMemo(() => {
    if (!data?.revenue?.totalDue) return 0
    return Math.round((data.revenue.collected / data.revenue.totalDue) * 100)
  }, [data?.revenue])

  // ── Styles ──
  const s = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: c.background } as const,
      content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl } as const,
      greeting: { fontSize: 24, fontWeight: '800' as const, color: c.text },
      subGreeting: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
      headerSection: { gap: 4, marginBottom: spacing.xs } as const,
      sectionTitle: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: c.textSecondary,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.8,
        marginBottom: spacing.xs,
      },
      statsGrid: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: spacing.sm,
      },
      statCard: {
        flex: 1,
        minWidth: '46%' as unknown as number,
        backgroundColor: c.surface,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: c.border,
        gap: spacing.sm,
      },
      statIconRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      },
      statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      statValue: { fontSize: 28, fontWeight: '800' as const, color: c.text },
      statLabel: { fontSize: 12, fontWeight: '600' as const, color: c.textSecondary },
      infoCard: {
        backgroundColor: c.surface,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: c.border,
        gap: spacing.md,
      },
      infoCardTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: c.text,
      },
      infoRow: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
      },
      infoLabel: { fontSize: 13, color: c.textSecondary },
      infoValue: { fontSize: 15, fontWeight: '700' as const, color: c.text },
      progressBarBg: {
        height: 8,
        borderRadius: 4,
        backgroundColor: c.border,
        overflow: 'hidden' as const,
      },
      progressBarFill: {
        height: 8,
        borderRadius: 4,
      },
      percentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
      },
      percentText: {
        fontSize: 13,
        fontWeight: '700' as const,
      },
      quickActionsRow: {
        flexDirection: 'row' as const,
        gap: spacing.sm,
      },
      quickCard: {
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: c.border,
        alignItems: 'center' as const,
        gap: spacing.sm,
      },
      quickValue: { fontSize: 28, fontWeight: '800' as const },
      quickLabel: { fontSize: 12, fontWeight: '600' as const, color: c.textSecondary, textAlign: 'center' as const },
    }),
    [c, spacing]
  )

  if (isLoading) return <LoadingScreen />

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {/* ── Welcome Header ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(0)} style={s.headerSection}>
          <Text style={s.greeting}>Welcome, {firstName}</Text>
          <Text style={s.subGreeting}>Here's your institution overview</Text>
        </Animated.View>

        {/* ── Stats Grid ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={s.sectionTitle}>Overview</Text>
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <View style={s.statIconRow}>
                <View style={[s.statIconCircle, { backgroundColor: c.infoLight }]}>
                  <GraduationCap size={20} color={c.info} />
                </View>
              </View>
              <Text style={s.statValue}>{data?.totalStudents ?? 0}</Text>
              <Text style={s.statLabel}>Total Students</Text>
            </View>

            <View style={s.statCard}>
              <View style={s.statIconRow}>
                <View style={[s.statIconCircle, { backgroundColor: c.successLight }]}>
                  <Users size={20} color={c.success} />
                </View>
              </View>
              <Text style={s.statValue}>{data?.totalFaculty ?? 0}</Text>
              <Text style={s.statLabel}>Total Faculty</Text>
            </View>

            <View style={s.statCard}>
              <View style={s.statIconRow}>
                <View style={[s.statIconCircle, { backgroundColor: c.warningLight }]}>
                  <UserCheck size={20} color={c.warning} />
                </View>
              </View>
              <Text style={s.statValue}>{data?.totalParents ?? 0}</Text>
              <Text style={s.statLabel}>Total Parents</Text>
            </View>

            <View style={s.statCard}>
              <View style={s.statIconRow}>
                <View style={[s.statIconCircle, { backgroundColor: c.errorLight }]}>
                  <Ticket size={20} color={c.error} />
                </View>
              </View>
              <Text style={s.statValue}>{data?.openTicketsCount ?? 0}</Text>
              <Text style={s.statLabel}>Open Tickets</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Attendance Card ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={s.infoCard}>
          <View style={s.infoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CalendarCheck size={18} color={c.primary} />
              <Text style={s.infoCardTitle}>Today's Attendance</Text>
            </View>
            <View
              style={[
                s.percentBadge,
                {
                  backgroundColor:
                    attendancePercent >= 75 ? c.successLight : c.errorLight,
                },
              ]}
            >
              <Text
                style={[
                  s.percentText,
                  {
                    color: attendancePercent >= 75 ? c.success : c.error,
                  },
                ]}
              >
                {attendancePercent}%
              </Text>
            </View>
          </View>

          <View style={s.progressBarBg}>
            <View
              style={[
                s.progressBarFill,
                {
                  width: `${attendancePercent}%`,
                  backgroundColor:
                    attendancePercent >= 75 ? c.success : c.error,
                },
              ]}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[s.infoValue, { color: c.success }]}>
                {data?.attendanceSummary?.present ?? 0}
              </Text>
              <Text style={s.infoLabel}>Present</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[s.infoValue, { color: c.error }]}>
                {data?.attendanceSummary?.absent ?? 0}
              </Text>
              <Text style={s.infoLabel}>Absent</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.infoValue}>
                {data?.attendanceSummary?.total ?? 0}
              </Text>
              <Text style={s.infoLabel}>Total</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Finance Card ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={s.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} color={c.primary} />
            <Text style={s.infoCardTitle}>Finance Overview</Text>
          </View>

          <View style={s.progressBarBg}>
            <View
              style={[
                s.progressBarFill,
                {
                  width: `${revenuePercent}%`,
                  backgroundColor: c.primary,
                },
              ]}
            />
          </View>

          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Collected</Text>
            <Text style={[s.infoValue, { color: c.success }]}>
              {formatCurrency(data?.revenue?.collected ?? 0)}
            </Text>
          </View>

          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Total Due</Text>
            <Text style={s.infoValue}>
              {formatCurrency(data?.revenue?.totalDue ?? 0)}
            </Text>
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: c.border,
              paddingTop: spacing.sm,
            }}
          >
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Pending Fees</Text>
              <Text style={[s.infoValue, { color: c.warning }]}>
                {formatCurrency(data?.pendingFeesTotal ?? 0)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Quick Actions ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <Text style={s.sectionTitle}>Requires Attention</Text>
          <View style={s.quickActionsRow}>
            <View style={s.quickCard}>
              <ClipboardList size={22} color={c.warning} />
              <Text style={[s.quickValue, { color: c.warning }]}>
                {data?.pendingLeavesCount ?? 0}
              </Text>
              <Text style={s.quickLabel}>Pending Leaves</Text>
            </View>

            <View style={s.quickCard}>
              <AlertTriangle size={22} color={c.error} />
              <Text style={[s.quickValue, { color: c.error }]}>
                {data?.recentEmergencyAlerts ?? 0}
              </Text>
              <Text style={s.quickLabel}>Emergency Alerts</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}
