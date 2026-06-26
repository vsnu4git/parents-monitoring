import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Shield,
  MapPin,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Eye,
  EyeOff,
  Zap,
  CheckCircle,
} from 'lucide-react-native'
import {
  getStudentLocation,
  markLocationAlertsRead,
  getDashboard,
} from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { StudentSelector } from '../components/StudentSelector'
import { useStudentSelector } from '../hooks/useStudentSelector'
import { useTheme } from '../hooks/useTheme'
import type { LocationAlertEntry } from '../types/api'

function AnimatedCard({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode
  style?: any
  delay?: number
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(delay).springify().damping(18).stiffness(200)}
      style={style}
    >
      {children}
    </Animated.View>
  )
}

const ALERT_CONFIG: Record<string, { icon: typeof MapPin; label: string; colorKey: 'error' | 'success' | 'warning' | 'primary' }> = {
  LEFT_CAMPUS: { icon: ArrowUpRight, label: 'Left Campus', colorKey: 'error' },
  ARRIVED_CAMPUS: { icon: ArrowDownLeft, label: 'Arrived Campus', colorKey: 'success' },
  MISSED_CHECKIN: { icon: Clock, label: 'Missed Check-in', colorKey: 'warning' },
  UNUSUAL_LOCATION: { icon: Zap, label: 'Unusual Location', colorKey: 'error' },
}

function formatAlertTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function formatAlertDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function GeofenceAlertsScreen() {
  const { c, spacing } = useTheme()
  const queryClient = useQueryClient()

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })
  const students = dashboard?.students || []
  const { selectedStudent, selectedStudentId, selectStudent } =
    useStudentSelector(students)

  const {
    data: locationData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['studentLocation', selectedStudentId],
    queryFn: () => getStudentLocation(selectedStudentId),
    enabled: !!selectedStudentId,
  })

  const markReadMutation = useMutation({
    mutationFn: (alertId?: string) => markLocationAlertsRead(selectedStudentId, alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentLocation', selectedStudentId] })
      queryClient.invalidateQueries({ queryKey: ['campusStatus', selectedStudentId] })
    },
  })

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (isLoading && !locationData) return <LoadingScreen />

  const alerts = locationData?.alerts || []
  const unreadCount = alerts.filter((a) => !a.isRead).length

  // Group alerts by date
  const groupedAlerts: Record<string, LocationAlertEntry[]> = {}
  for (const alert of alerts) {
    const key = formatAlertDate(alert.createdAt)
    if (!groupedAlerts[key]) groupedAlerts[key] = []
    groupedAlerts[key].push(alert)
  }
  const dateGroups = Object.entries(groupedAlerts)

  // Stats
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayAlerts = alerts.filter((a) => new Date(a.createdAt) >= todayStart)
  const leftCampusToday = todayAlerts.filter((a) => a.type === 'LEFT_CAMPUS').length
  const arrivedCampusToday = todayAlerts.filter((a) => a.type === 'ARRIVED_CAMPUS').length
  const unusualToday = todayAlerts.filter((a) => a.type === 'UNUSUAL_LOCATION').length

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.md }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={c.primary}
          colors={[c.primary]}
        />
      }
    >
      <StudentSelector
        students={students}
        selectedId={selectedStudentId}
        onSelect={selectStudent}
      />

      {/* Header */}
      <AnimatedCard delay={0}>
        <LinearGradient
          colors={[c.headerGradientStart, c.headerGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { borderColor: c.border }]}
        >
          <View style={styles.headerRow}>
            <Shield size={16} color={c.primary} />
            <Text style={[styles.headerTitle, { color: c.text }]}>
              Geofence Alerts
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>
            Campus boundary crossing history
          </Text>
        </LinearGradient>
      </AnimatedCard>

      {/* Stats Row */}
      <AnimatedCard delay={25}>
        <View style={styles.statsRow}>
          <View style={[styles.statPill, { backgroundColor: c.surface, borderColor: c.border }]}>
            <ArrowUpRight size={14} color={c.error} style={{ marginBottom: 2 }} />
            <Text style={[styles.statValue, { color: c.error }]}>{leftCampusToday}</Text>
            <Text style={[styles.statLabel, { color: c.textDark }]}>EXITS</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: c.surface, borderColor: c.border }]}>
            <ArrowDownLeft size={14} color={c.success} style={{ marginBottom: 2 }} />
            <Text style={[styles.statValue, { color: c.success }]}>{arrivedCampusToday}</Text>
            <Text style={[styles.statLabel, { color: c.textDark }]}>ENTRIES</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Zap size={14} color={c.warning} style={{ marginBottom: 2 }} />
            <Text style={[styles.statValue, { color: c.warning }]}>{unusualToday}</Text>
            <Text style={[styles.statLabel, { color: c.textDark }]}>UNUSUAL</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: c.surface, borderColor: unreadCount > 0 ? c.dangerBorder : c.border }]}>
            <EyeOff size={14} color={unreadCount > 0 ? c.error : c.textDim} style={{ marginBottom: 2 }} />
            <Text style={[styles.statValue, { color: unreadCount > 0 ? c.error : c.textDim }]}>{unreadCount}</Text>
            <Text style={[styles.statLabel, { color: c.textDark }]}>UNREAD</Text>
          </View>
        </View>
      </AnimatedCard>

      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <AnimatedCard delay={50}>
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: c.surface, borderColor: c.border }]}
            activeOpacity={0.7}
            onPress={() => markReadMutation.mutate(undefined)}
            disabled={markReadMutation.isPending}
          >
            <CheckCircle size={14} color={c.primary} />
            <Text style={[styles.markAllText, { color: c.primary }]}>
              {markReadMutation.isPending ? 'Marking...' : `Mark all ${unreadCount} as read`}
            </Text>
          </TouchableOpacity>
        </AnimatedCard>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <EmptyState
          icon="shield"
          title="No alerts"
          message="No geofence alerts have been recorded yet."
        />
      )}

      {/* Alert Groups */}
      {dateGroups.map(([dateLabel, groupAlerts], groupIdx) => (
        <AnimatedCard key={dateLabel} delay={75 + groupIdx * 30}>
          <View style={styles.dateGroup}>
            <Text style={[styles.dateLabel, { color: c.textTertiary }]}>
              {dateLabel}
            </Text>
            <View style={[styles.alertsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              {groupAlerts.map((alert, i) => {
                const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.UNUSUAL_LOCATION
                const AlertIcon = config.icon
                const alertColor = c[config.colorKey]

                return (
                  <TouchableOpacity
                    key={alert.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!alert.isRead) {
                        markReadMutation.mutate(alert.id)
                      }
                    }}
                    style={[
                      styles.alertRow,
                      i < groupAlerts.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.borderLight },
                      !alert.isRead && { backgroundColor: alertColor + '08' },
                    ]}
                  >
                    <View style={[styles.alertIconBox, { backgroundColor: alertColor + '15' }]}>
                      <AlertIcon size={16} color={alertColor} />
                    </View>
                    <View style={styles.alertInfo}>
                      <View style={styles.alertTopRow}>
                        <Text style={[styles.alertType, { color: alertColor, fontWeight: alert.isRead ? '500' : '700' }]}>
                          {config.label}
                        </Text>
                        {!alert.isRead && (
                          <View style={[styles.unreadDot, { backgroundColor: alertColor }]} />
                        )}
                      </View>
                      <Text style={[styles.alertMessage, { color: c.textSecondary }]} numberOfLines={2}>
                        {alert.message}
                      </Text>
                      <View style={styles.alertMetaRow}>
                        <Clock size={10} color={c.textDarkest} style={{ marginRight: 3 }} />
                        <Text style={[styles.alertTime, { color: c.textDarkest }]}>
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                        {alert.latitude && alert.longitude && (
                          <>
                            <MapPin size={10} color={c.textDarkest} style={{ marginLeft: 8, marginRight: 3 }} />
                            <Text style={[styles.alertTime, { color: c.textDarkest }]}>
                              {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </AnimatedCard>
      ))}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 12 },

  headerGradient: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 7, fontWeight: '700', letterSpacing: 1, marginTop: 1 },

  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  markAllText: { fontSize: 13, fontWeight: '600' },

  dateGroup: { gap: 6 },
  dateLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 4 },

  alertsCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },

  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertInfo: { flex: 1, minWidth: 0 },
  alertTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertType: { fontSize: 13 },
  unreadDot: { width: 6, height: 6, borderRadius: 3 },
  alertMessage: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  alertMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  alertTime: { fontSize: 10, fontVariant: ['tabular-nums'] },
})
