import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native'
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react-native'
import { getSOSAlerts, triggerSOS, updateSOSAlert, getDashboard } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { StudentSelector } from '../components/StudentSelector'
import { useStudentSelector } from '../hooks/useStudentSelector'
import { useTheme } from '../hooks/useTheme'
import { formatDateTime } from '../utils/format'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  ACKNOWLEDGED: 'Acknowledged',
  RESOLVED: 'Resolved',
  FALSE_ALARM: 'False Alarm',
}

export function SOSScreen() {
  const { c, sc, spacing } = useTheme()
  const queryClient = useQueryClient()

  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const students = dashboard?.students || []
  const { selectedStudent, selectedStudentId, selectStudent } = useStudentSelector(students)

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['sosAlerts'],
    queryFn: getSOSAlerts,
  })

  const sosMutation = useMutation({
    mutationFn: triggerSOS,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sosAlerts'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateSOSAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sosAlerts'] })
    },
  })

  const [refreshing, setRefreshing] = useState(false)
  const [pulseOn, setPulseOn] = useState(true)
  const pulseScale = useSharedValue(1)

  const activeAlert = (alerts || []).find((a: any) => a.status === 'ACTIVE')
  const pastAlerts = (alerts || []).filter((a: any) => a.status !== 'ACTIVE')

  // Pulse overlay toggle for active alert
  useEffect(() => {
    if (!activeAlert) return
    const interval = setInterval(() => setPulseOn((p) => !p), 800)
    return () => clearInterval(interval)
  }, [activeAlert])

  // Scale pulse animation for SOS circle
  useEffect(() => {
    if (!activeAlert) return
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
    )
    return () => cancelAnimation(pulseScale)
  }, [activeAlert])

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleTriggerSOS = () => {
    if (!selectedStudentId) return
    Alert.alert(
      'Simulate SOS Alert',
      `This will send a test emergency SOS alert for ${selectedStudent?.name || 'your student'}. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            sosMutation.mutate({
              studentId: selectedStudentId,
              message: 'Test SOS Alert - Simulation',
              latitude: 11.0168 + (Math.random() - 0.5) * 0.01,
              longitude: 76.9558 + (Math.random() - 0.5) * 0.01,
            })
          },
        },
      ]
    )
  }

  if (isLoading && !alerts) return <LoadingScreen />

  // ─── ACTIVE ALERT VIEW ───
  if (activeAlert) {
    return (
      <View style={[s.activeRoot, { backgroundColor: c.background }]}>
        {/* Pulsing red overlay */}
        <View
          style={[
            s.pulseOverlay,
            {
              backgroundColor: pulseOn
                ? `${c.error}14`
                : `${c.error}08`,
            },
          ]}
        />

        <ScrollView
          style={s.activeScrollView}
          contentContainerStyle={[s.activeContent, { padding: spacing.lg }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
          }
        >
          {/* SOS Pulse Circle */}
          <View style={s.sosCircleWrapper}>
            <Animated.View
              style={[
                s.sosCircle,
                {
                  backgroundColor: pulseOn ? c.error : '#B71C1C',
                  shadowColor: c.error,
                  shadowOpacity: pulseOn ? 0.6 : 0.3,
                },
                pulseAnimStyle,
              ]}
            >
              <Text style={s.sosCircleText}>SOS</Text>
            </Animated.View>
          </View>

          {/* Student info */}
          <View style={s.studentInfoCenter}>
            <Text style={[s.emergencyTitle, { color: c.error }]}>EMERGENCY ALERT</Text>
            <Text style={[s.emergencyStudentName, { color: c.text }]}>
              {activeAlert.student?.name || selectedStudent?.name}
            </Text>
          </View>

          {/* Alert message card */}
          {activeAlert.message && (
            <View
              style={[
                s.infoCard,
                {
                  backgroundColor: c.errorLight,
                  borderColor: c.dangerBorder,
                },
              ]}
            >
              <View style={s.infoCardHeader}>
                <MessageSquare size={14} color={c.textTertiary} />
                <Text style={[s.infoCardLabel, { color: c.textTertiary }]}>Message</Text>
              </View>
              <Text style={[s.infoCardValue, { color: c.text }]}>{activeAlert.message}</Text>
            </View>
          )}

          {/* Trigger time card */}
          <View
            style={[
              s.infoCard,
              {
                backgroundColor: c.cardGlow,
                borderColor: c.cardBorder,
              },
            ]}
          >
            <View style={s.infoCardHeader}>
              <Clock size={14} color={c.textTertiary} />
              <Text style={[s.infoCardLabel, { color: c.textTertiary }]}>Triggered at</Text>
            </View>
            <Text style={[s.infoCardValue, { color: c.primary }]}>
              {formatDateTime(activeAlert.createdAt)}
            </Text>
          </View>

          {/* Location card */}
          {activeAlert.latitude && activeAlert.longitude && (
            <View
              style={[
                s.infoCard,
                {
                  backgroundColor: c.errorLight,
                  borderColor: c.dangerBorder,
                },
              ]}
            >
              <View style={s.infoCardHeader}>
                <MapPin size={14} color={c.textTertiary} />
                <Text style={[s.infoCardLabel, { color: c.textTertiary }]}>Location</Text>
              </View>
              <Text style={[s.infoCardValue, { color: c.text }]}>
                {activeAlert.latitude.toFixed(4)}, {activeAlert.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={s.actionButtonsStack}>
            <TouchableOpacity
              style={[s.actionButton, { backgroundColor: c.warning }, updateMutation.isPending && s.disabledOpacity]}
              onPress={() => updateMutation.mutate({ alertId: activeAlert.id, status: 'ACKNOWLEDGED' })}
              activeOpacity={0.7}
              disabled={updateMutation.isPending}
            >
              <ShieldCheck size={20} color={c.buttonText} />
              <Text style={[s.actionButtonText, { color: c.buttonText }]}>Acknowledge Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionButton, { backgroundColor: c.success }, updateMutation.isPending && s.disabledOpacity]}
              onPress={() => updateMutation.mutate({ alertId: activeAlert.id, status: 'RESOLVED' })}
              activeOpacity={0.7}
              disabled={updateMutation.isPending}
            >
              <CheckCircle size={20} color="#fff" />
              <Text style={[s.actionButtonText, { color: '#fff' }]}>Mark Resolved</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.actionButton,
                {
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: c.textTertiary,
                },
                updateMutation.isPending && s.disabledOpacity,
              ]}
              onPress={() => updateMutation.mutate({ alertId: activeAlert.id, status: 'FALSE_ALARM' })}
              activeOpacity={0.7}
              disabled={updateMutation.isPending}
            >
              <XCircle size={20} color={c.textTertiary} />
              <Text style={[s.actionButtonText, { color: c.textTertiary }]}>False Alarm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.actionButton,
                {
                  backgroundColor: c.cardGlow,
                  borderWidth: 1,
                  borderColor: c.primary,
                },
              ]}
              onPress={() => {
                Linking.openURL(`tel:${activeAlert.student?.registerNumber || ''}`)
              }}
              activeOpacity={0.7}
            >
              <Phone size={20} color={c.primary} />
              <Text style={[s.actionButtonText, { color: c.primary }]}>Call Student</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </View>
    )
  }

  // ─── NO ACTIVE ALERT VIEW ───
  return (
    <ScrollView
      style={[s.container, { backgroundColor: c.background }]}
      contentContainerStyle={[s.content, { padding: spacing.lg }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
      }
    >
      <StudentSelector students={students} selectedId={selectedStudentId} onSelect={selectStudent} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)}>
        <View style={s.headerSection}>
          <View style={s.headerRow}>
            <ShieldAlert size={24} color={c.primary} />
            <Text style={[s.headerTitle, { color: c.primary }]}>SOS Dashboard</Text>
          </View>
          {selectedStudent && (
            <Text style={[s.headerSubtitle, { color: c.textTertiary }]}>{selectedStudent.name}</Text>
          )}
        </View>
      </Animated.View>

      {/* Green status card */}
      <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)}>
        <View
          style={[
            s.statusCard,
            {
              backgroundColor: c.successLight,
              borderColor: c.successBorder,
            },
          ]}
        >
          <ShieldCheck size={24} color={c.success} />
          <Text style={[s.statusText, { color: c.success }]}>No Active SOS Alerts</Text>
        </View>
      </Animated.View>

      {/* Simulate SOS button */}
      <Animated.View entering={FadeInDown.duration(400).delay(120).springify().damping(18).stiffness(180)}>
        <TouchableOpacity
          style={[
            s.simulateButton,
            {
              borderColor: c.error,
              backgroundColor: c.errorLight,
            },
            sosMutation.isPending && s.disabledOpacity,
          ]}
          onPress={handleTriggerSOS}
          activeOpacity={0.7}
          disabled={sosMutation.isPending}
        >
          <AlertTriangle size={18} color={c.error} />
          <Text style={[s.simulateButtonText, { color: c.error }]}>
            {sosMutation.isPending ? 'Simulating...' : 'Simulate SOS (Testing)'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* SOS History */}
      <Animated.View entering={FadeInDown.duration(400).delay(180).springify().damping(18).stiffness(180)}>
        <Text style={[s.historyTitle, { color: c.primary }]}>SOS History</Text>
      </Animated.View>

      {pastAlerts.length === 0 ? (
        <View
          style={[
            s.emptyHistoryCard,
            {
              backgroundColor: c.cardGlow,
              borderColor: c.cardBorder,
            },
          ]}
        >
          <Text style={[s.emptyHistoryText, { color: c.textTertiary }]}>
            No SOS alerts recorded.
          </Text>
        </View>
      ) : (
        <View style={s.historyList}>
          {pastAlerts.map((alert: any) => {
            const statusStyle = sc[alert.status] || { bg: c.surfaceVariant, text: c.textTertiary }
            return (
              <View
                key={alert.id}
                style={[
                  s.historyCard,
                  {
                    backgroundColor: c.cardGlow,
                    borderColor: c.cardBorder,
                  },
                ]}
              >
                <View style={s.historyCardHeader}>
                  <Text style={[s.historyDate, { color: c.textTertiary }]}>
                    {formatDateTime(alert.createdAt)}
                  </Text>
                  <View style={[s.historyBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[s.historyBadgeText, { color: statusStyle.text }]}>
                      {STATUS_LABELS[alert.status] || alert.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                {alert.message && (
                  <Text style={[s.historyMessage, { color: c.text }]}>{alert.message}</Text>
                )}
                {alert.latitude && alert.longitude && (
                  <View style={s.historyLocationRow}>
                    <MapPin size={12} color={c.textTertiary} />
                    <Text style={[s.historyLocation, { color: c.textTertiary }]}>
                      {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                    </Text>
                  </View>
                )}
                {alert.resolvedAt && (
                  <View style={s.historyLocationRow}>
                    <Clock size={12} color={c.textTertiary} />
                    <Text style={[s.historyLocation, { color: c.textTertiary }]}>
                      Resolved: {formatDateTime(alert.resolvedAt)}
                    </Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  // ─── Common ───
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
  },

  // ─── No Active: Header ───
  headerSection: {
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 34,
  },

  // ─── Green status card ───
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Simulate SOS button ───
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  simulateButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledOpacity: {
    opacity: 0.6,
  },

  // ─── History ───
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyHistoryCard: {
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    padding: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 13,
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  historyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  historyLocation: {
    fontSize: 12,
  },

  // ─── Active Alert View ───
  activeRoot: {
    flex: 1,
  },
  pulseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  activeScrollView: {
    flex: 1,
    zIndex: 1,
  },
  activeContent: {},

  // ─── SOS circle ───
  sosCircleWrapper: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  sosCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 60,
    elevation: 20,
  },
  sosCircleText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 6,
  },

  // ─── Student info center ───
  studentInfoCenter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emergencyTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  emergencyStudentName: {
    fontSize: 20,
    marginTop: 8,
  },

  // ─── Info cards (message, time, location) ───
  infoCard: {
    padding: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoCardLabel: {
    fontSize: 12,
  },
  infoCardValue: {
    fontSize: 16,
  },

  // ─── Action buttons stack ───
  actionButtonsStack: {
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
})
