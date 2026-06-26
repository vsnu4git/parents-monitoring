import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Navigation,
  MapPin,
  Clock,
  ChevronRight,
  ArrowRight,
  FileText,
  Circle,
  Compass,
} from 'lucide-react-native'
import { getStudentODTrips, getDashboard } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { StudentSelector } from '../components/StudentSelector'
import { useStudentSelector } from '../hooks/useStudentSelector'
import { useTheme } from '../hooks/useTheme'
import { formatDateTime } from '../utils/format'

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

function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.6, { duration: 1000 }),
      -1, true
    )
    return () => cancelAnimation(scale)
  }, [])

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <View style={styles.pulsingDotContainer}>
      <Animated.View
        style={[
          styles.pulsingDotOuter,
          { backgroundColor: color + '30' },
          outerStyle,
        ]}
      />
      <View style={[styles.pulsingDotInner, { backgroundColor: color }]} />
    </View>
  )
}

export function ODTrackerScreen() {
  const { c, sc, spacing } = useTheme()

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })
  const students = dashboard?.students || []
  const { selectedStudent, selectedStudentId, selectStudent } =
    useStudentSelector(students)

  const {
    data: trips,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['odTrips', selectedStudentId],
    queryFn: () => getStudentODTrips(selectedStudentId),
    enabled: !!selectedStudentId,
  })

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (isLoading && !trips) return <LoadingScreen />

  const activeTrips = (trips || []).filter(
    (t) => t.status === 'PENDING' || t.status === 'IN_TRANSIT'
  )
  const historyTrips = (trips || []).filter(
    (t) => t.status !== 'PENDING' && t.status !== 'IN_TRANSIT'
  )

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { color: string; bg: string; label: string }
    > = {
      PENDING: { color: c.warning, bg: c.warningLight, label: 'Pending' },
      IN_TRANSIT: {
        color: c.primary,
        bg: c.primary + '1F',
        label: 'In Transit',
      },
      ARRIVED: { color: c.success, bg: c.successLight, label: 'Arrived' },
      RETURNED: {
        color: c.textSecondary,
        bg: c.surfaceVariant,
        label: 'Returned',
      },
      MISSED: { color: c.error, bg: c.errorLight, label: 'Missed' },
    }
    return configs[status] || configs.PENDING
  }

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
            <Navigation size={16} color={c.primary} />
            <Text style={[styles.headerTitle, { color: c.text }]}>
              OD Trip Tracker
            </Text>
          </View>
          {selectedStudent && (
            <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>
              {selectedStudent.name} - Track on-duty trips in real time
            </Text>
          )}
        </LinearGradient>
      </AnimatedCard>

      {(trips || []).length === 0 && (
        <EmptyState
          icon="map"
          title="No OD trips"
          message="No on-duty trips found for this student."
        />
      )}

      {/* Active Trips Section Header */}
      <AnimatedCard delay={50}>
        <View style={styles.sectionHeaderRow}>
          <PulsingDot color={c.primary} />
          <Text style={[styles.activeSectionTitle, { color: c.primary }]}>
            Active Trips ({activeTrips.length})
          </Text>
        </View>
      </AnimatedCard>

      {activeTrips.length === 0 ? (
        <AnimatedCard delay={100}>
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Navigation size={20} color={c.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyCardText, { color: c.textMuted }]}>
              No active OD trips right now.
            </Text>
          </View>
        </AnimatedCard>
      ) : (
        activeTrips.map((trip, idx) => {
          const cfg = getStatusConfig(trip.status)
          return (
            <AnimatedCard key={trip.id} delay={100 + idx * 60}>
              <View
                style={[
                  styles.activeTripCard,
                  { backgroundColor: c.surface, borderColor: c.border },
                ]}
              >
                {/* Trip header */}
                <View
                  style={[
                    styles.activeTripHeader,
                    { borderBottomColor: c.border },
                  ]}
                >
                  <View style={styles.activeTripHeaderLeft}>
                    <View style={styles.activeTripDestRow}>
                      <MapPin
                        size={16}
                        color={cfg.color}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[styles.activeTripDest, { color: c.textLight }]}
                      >
                        {trip.destinationName}
                      </Text>
                    </View>
                    <View style={styles.activeTripRadiusRow}>
                      <Compass
                        size={12}
                        color={c.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.activeTripRadius,
                          { color: c.textSecondary },
                        ]}
                      >
                        Geofence: {trip.radiusM}m radius
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: cfg.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusBadgeText, { color: cfg.color }]}
                    >
                      {cfg.label}
                    </Text>
                  </View>
                </View>

                {/* Time grid */}
                <View style={styles.timeGrid}>
                  <View style={styles.timeGridItem}>
                    <View style={styles.timeGridLabelRow}>
                      <Clock
                        size={11}
                        color={c.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[styles.timeGridLabel, { color: c.textMuted }]}
                      >
                        Departed
                      </Text>
                    </View>
                    <Text
                      style={[styles.timeGridValue, { color: c.textLight }]}
                    >
                      {trip.departedAt ? formatDateTime(trip.departedAt) : '--'}
                    </Text>
                  </View>
                  <View style={styles.timeGridItem}>
                    <View style={styles.timeGridLabelRow}>
                      <Clock
                        size={11}
                        color={c.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[styles.timeGridLabel, { color: c.textMuted }]}
                      >
                        Arrived
                      </Text>
                    </View>
                    <Text
                      style={[styles.timeGridValue, { color: c.textLight }]}
                    >
                      {trip.arrivedAt ? formatDateTime(trip.arrivedAt) : '--'}
                    </Text>
                  </View>
                </View>

                {/* Location info */}
                {trip.lastLat && trip.lastLng && (
                  <View
                    style={[
                      styles.locationRow,
                      { borderTopColor: c.borderLight },
                    ]}
                  >
                    <View style={styles.locationLabelRow}>
                      <MapPin
                        size={11}
                        color={c.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[styles.timeGridLabel, { color: c.textMuted }]}
                      >
                        Last Location
                      </Text>
                    </View>
                    <Text
                      style={[styles.locationValue, { color: c.textLight }]}
                    >
                      {trip.lastLat.toFixed(4)}, {trip.lastLng.toFixed(4)}
                    </Text>
                  </View>
                )}

                {/* Leave record */}
                {trip.leaveRecord && (
                  <View
                    style={[
                      styles.leaveSection,
                      {
                        borderTopColor: c.border,
                        backgroundColor: c.surfaceVariant,
                      },
                    ]}
                  >
                    <View style={styles.leaveLabelRow}>
                      <FileText
                        size={12}
                        color={c.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.leaveText, { color: c.textMuted }]}>
                        Leave: {trip.leaveRecord.type} | Reason:{' '}
                        {trip.leaveRecord.reason}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </AnimatedCard>
          )
        })
      )}

      {/* Trip History */}
      {historyTrips.length > 0 && (
        <>
          <AnimatedCard delay={200}>
            <View style={styles.historySectionRow}>
              <Clock size={16} color={c.textLight} style={{ marginRight: 8 }} />
              <Text
                style={[styles.historySectionTitle, { color: c.textLight }]}
              >
                Trip History
              </Text>
            </View>
          </AnimatedCard>

          {historyTrips.map((trip, idx) => {
            const cfg = getStatusConfig(trip.status)
            return (
              <AnimatedCard key={trip.id} delay={250 + idx * 40}>
                <View
                  style={[
                    styles.historyCard,
                    { backgroundColor: c.surface, borderColor: c.border },
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <View style={styles.historyTopRow}>
                      <Text
                        style={[styles.historyDest, { color: c.textLight }]}
                        numberOfLines={1}
                      >
                        {trip.destinationName}
                      </Text>
                      <View
                        style={[
                          styles.statusBadgeSmall,
                          { backgroundColor: cfg.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeSmallText,
                            { color: cfg.color },
                          ]}
                        >
                          {cfg.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyDates}>
                      <Text
                        style={[styles.historyDate, { color: c.textMuted }]}
                      >
                        {trip.departedAt
                          ? formatDateTime(trip.departedAt)
                          : 'Not departed'}
                      </Text>
                      <ArrowRight size={12} color={c.textMuted} />
                      <Text
                        style={[styles.historyDate, { color: c.textMuted }]}
                      >
                        {trip.returnedAt
                          ? formatDateTime(trip.returnedAt)
                          : trip.arrivedAt
                            ? formatDateTime(trip.arrivedAt) + ' (arrived)'
                            : '--'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <View style={styles.historyRadiusRow}>
                      <Compass
                        size={10}
                        color={c.textMuted}
                        style={{ marginRight: 3 }}
                      />
                      <Text
                        style={[styles.historyRadius, { color: c.textMuted }]}
                      >
                        {trip.radiusM}m
                      </Text>
                    </View>
                    <Text
                      style={[styles.historyCreated, { color: c.textMuted }]}
                    >
                      {new Date(trip.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </AnimatedCard>
            )
          })}
        </>
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 12,
  },

  // Header
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  // Active trips section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
    marginTop: 4,
  },
  pulsingDotContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingDotOuter: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pulsingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Empty card
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 14,
  },

  // Active trip card
  activeTripCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
  },
  activeTripHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  activeTripDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTripDest: {
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
  },
  activeTripRadiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  activeTripRadius: {
    fontSize: 14,
  },

  // Status badges
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Time grid
  timeGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  timeGridItem: {
    flex: 1,
  },
  timeGridLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeGridLabel: {
    fontSize: 12,
  },
  timeGridValue: {
    fontSize: 14,
    marginTop: 2,
  },

  // Location
  locationRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationValue: {
    fontSize: 14,
    marginTop: 2,
  },

  // Leave record
  leaveSection: {
    padding: 12,
    borderTopWidth: 1,
  },
  leaveLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveText: {
    fontSize: 12,
    flex: 1,
  },

  // History section
  historySectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  // History card
  historyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLeft: {
    flex: 1,
    minWidth: 0,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDest: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  historyDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  historyDate: {
    fontSize: 12,
    flexShrink: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  historyRadiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyRadius: {
    fontSize: 12,
  },
  historyCreated: {
    fontSize: 12,
    marginTop: 2,
  },
})
