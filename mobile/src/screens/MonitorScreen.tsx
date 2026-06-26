import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import {
  MapPin,
  Activity,
  UtensilsCrossed,
  Wallet,
  Bell,
  Navigation,
  ChevronRight,
  Coffee,
  Cookie,
  Moon,
  AlertTriangle,
  Check,
  Shield,
  Clock,
} from 'lucide-react-native'
import {
  getStudentCampusStatus,
  getStudentExpenses,
  getStudentFoodLog,
  getStudentODTrips,
  getStudentLocation,
  getDashboard,
} from '../api/endpoints'
import { CampusMap } from '../components/CampusMap'
import { pushIslandNotification } from '../components/DynamicIsland'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { StudentSelector } from '../components/StudentSelector'
import { useStudentSelector } from '../hooks/useStudentSelector'
import { useTheme } from '../hooks/useTheme'
import { formatDateTime } from '../utils/format'
import type { MonitorStackParamList } from '../types/navigation'

type Nav = NativeStackNavigationProp<MonitorStackParamList>

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "B'fast",
  LUNCH: 'Lunch',
  SNACKS: 'Snack',
  DINNER: 'Dinner',
}

const MEAL_ICONS: Record<string, React.ComponentType<any>> = {
  BREAKFAST: Coffee,
  LUNCH: UtensilsCrossed,
  SNACKS: Cookie,
  DINNER: Moon,
}

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

export function MonitorScreen() {
  const navigation = useNavigation<Nav>()
  const { c, sc, spacing } = useTheme()

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })
  const students = dashboard?.students || []
  const { selectedStudent, selectedStudentId, selectStudent } =
    useStudentSelector(students)

  const {
    data: campusStatus,
    isLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['campusStatus', selectedStudentId],
    queryFn: () => getStudentCampusStatus(selectedStudentId),
    enabled: !!selectedStudentId,
    refetchInterval: 5000, // 5s for live tracking
  })

  const { data: expenses, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', selectedStudentId],
    queryFn: () => getStudentExpenses(selectedStudentId),
    enabled: !!selectedStudentId,
  })

  const { data: foodLog, refetch: refetchFood } = useQuery({
    queryKey: ['foodLog', selectedStudentId],
    queryFn: () => getStudentFoodLog(selectedStudentId),
    enabled: !!selectedStudentId,
  })

  const { data: odTrips, refetch: refetchOD } = useQuery({
    queryKey: ['odTrips', selectedStudentId],
    queryFn: () => getStudentODTrips(selectedStudentId),
    enabled: !!selectedStudentId,
  })

  const { data: locationData, refetch: refetchLocation } = useQuery({
    queryKey: ['studentLocation', selectedStudentId],
    queryFn: () => getStudentLocation(selectedStudentId),
    enabled: !!selectedStudentId,
    refetchInterval: 5000, // 5s for live location
  })

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      refetchStatus(),
      refetchExpenses(),
      refetchFood(),
      refetchOD(),
      refetchLocation(),
    ])
    setRefreshing(false)
  }

  // ── Dynamic Island: notify parent when campus status changes ──
  const prevCampusStatus = useRef<boolean | null>(null)
  useEffect(() => {
    if (campusStatus === undefined) return
    const current = campusStatus?.isOnCampus ?? null
    if (prevCampusStatus.current !== null && prevCampusStatus.current !== current) {
      if (current) {
        pushIslandNotification({
          type: 'campus_entry',
          title: `${selectedStudent?.name || 'Student'} entered campus`,
          subtitle: campusStatus?.lastCheckIn?.label || 'Campus',
        })
      } else {
        pushIslandNotification({
          type: 'campus_exit',
          title: `${selectedStudent?.name || 'Student'} left campus`,
          subtitle: 'Location alert triggered',
        })
      }
    }
    prevCampusStatus.current = current
  }, [campusStatus?.isOnCampus])

  if (isLoading && !campusStatus) return <LoadingScreen />
  if (!selectedStudent)
    return <EmptyState icon="user" title="No students found" />

  const activeTrips = (odTrips || []).filter(
    (t) => t.status === 'IN_TRANSIT' || t.status === 'PENDING'
  )
  const activeOdTrip = activeTrips.length > 0 ? activeTrips[0] : null

  // Location data for the map
  const locationCheckIns = locationData?.checkIns || []
  const lastCheckIn = campusStatus?.lastCheckIn || locationCheckIns[0] || null
  const mapLat = lastCheckIn?.latitude || 0
  const mapLng = lastCheckIn?.longitude || 0
  const campusZones = locationData?.zones || []
  const checkInHistory = campusStatus?.todayCheckIns || locationCheckIns

  const todayMeals = (foodLog || []).filter((f) => {
    const d = new Date(f.loggedAt)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })
  const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'] as const
  const loggedMeals = new Set(todayMeals.map((f) => f.mealType))

  const hour = new Date().getHours()
  const expected: string[] = []
  if (hour >= 9) expected.push('BREAKFAST')
  if (hour >= 14) expected.push('LUNCH')
  if (hour >= 18) expected.push('SNACKS')
  if (hour >= 21) expected.push('DINNER')
  const missed = expected.filter((m) => !loggedMeals.has(m))
  const mealsCount = todayMeals.length

  const totalSpent = expenses?.todaySpent || 0
  const todayTxns =
    expenses?.transactions?.filter((t) => {
      const txDate = new Date(t.transactionAt)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return txDate >= today
    }) || []

  const unreadAlerts = campusStatus?.unreadAlerts || 0

  const odColors: Record<string, string> = {
    PENDING: c.warning,
    IN_TRANSIT: c.primary,
    ARRIVED: c.success,
    RETURNED: c.textSecondary,
    MISSED: c.error,
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
            <MapPin size={14} color={c.primary} />
            <Text
              style={[
                styles.headerLabel,
                { color: c.textTertiary },
              ]}
            >
              MONITORING
            </Text>
          </View>
          <Text style={[styles.headerName, { color: c.text }]}>
            {selectedStudent.name}
          </Text>
        </LinearGradient>
      </AnimatedCard>

      {/* Campus Map */}
      <AnimatedCard delay={25}>
        <CampusMap
          studentName={selectedStudent.name}
          isOnCampus={campusStatus?.isOnCampus ?? true}
          currentLat={mapLat}
          currentLng={mapLng}
          checkInHistory={checkInHistory}
          campusZones={campusZones}
          odTrip={activeOdTrip}
          lastSeenTime={lastCheckIn ? new Date(lastCheckIn.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : undefined}
        />
      </AnimatedCard>

      {/* Geofence Status Card */}
      {campusStatus && (
        <AnimatedCard delay={40}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('GeofenceAlerts')}
            style={[
              styles.geofenceCard,
              {
                backgroundColor: c.surface,
                borderColor: campusStatus.curfewViolation ? c.dangerBorder : c.border,
              },
            ]}
          >
            <View style={styles.geofenceCardTop}>
              <View style={[styles.geofenceIconBox, { backgroundColor: (campusStatus.isOnCampus ? c.success : c.error) + '15' }]}>
                <Shield size={18} color={campusStatus.isOnCampus ? c.success : c.error} />
              </View>
              <View style={styles.geofenceInfo}>
                <Text style={[styles.geofenceTitle, { color: c.text }]}>
                  {campusStatus.isOnCampus ? 'Inside Campus' : 'Outside Campus'}
                </Text>
                <Text style={[styles.geofenceMeta, { color: c.textSecondary }]}>
                  {campusStatus.currentZone
                    ? `Zone: ${campusStatus.currentZone}`
                    : campusStatus.distanceFromCampus != null
                      ? `${campusStatus.distanceFromCampus}m from campus center`
                      : 'Location data pending'}
                </Text>
              </View>
              {unreadAlerts > 0 && (
                <View style={[styles.alertBadge, { backgroundColor: c.error }]}>
                  <Text style={styles.alertBadgeText}>{unreadAlerts}</Text>
                </View>
              )}
              <ChevronRight size={18} color={c.textDarkest} />
            </View>
            {campusStatus.curfewViolation && (
              <View style={[styles.curfewWarning, { backgroundColor: c.dangerBg, borderTopColor: c.dangerBorder }]}>
                <Clock size={12} color={c.error} />
                <Text style={[styles.curfewWarningText, { color: c.error }]}>
                  Off campus past curfew time
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </AnimatedCard>
      )}

      {/* Quick Glance: 4 pills */}
      <AnimatedCard delay={50}>
        <View style={styles.quickGlanceRow}>
          {/* Check-ins */}
          <View
            style={[
              styles.quickPill,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Activity size={14} color={c.textTertiary} style={{ marginBottom: 4 }} />
            <Text style={[styles.quickPillValue, { color: c.text }]}>
              {campusStatus?.todayCheckIns.length || 0}
            </Text>
            <Text style={[styles.quickPillLabel, { color: c.textDark }]}>
              CHECK-INS
            </Text>
          </View>
          {/* Meals */}
          <View
            style={[
              styles.quickPill,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <UtensilsCrossed
              size={14}
              color={c.textTertiary}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.quickPillValue, { color: c.text }]}>
              {mealsCount}/4
            </Text>
            <Text style={[styles.quickPillLabel, { color: c.textDark }]}>
              MEALS
            </Text>
          </View>
          {/* Spent */}
          <View
            style={[
              styles.quickPill,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Wallet size={14} color={c.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.quickPillValue, { color: c.primary }]}>
              {'\u20B9'}
              {totalSpent}
            </Text>
            <Text style={[styles.quickPillLabel, { color: c.textDark }]}>
              SPENT
            </Text>
          </View>
          {/* Alerts — tappable to open GeofenceAlerts */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('GeofenceAlerts')}
            style={[
              styles.quickPill,
              {
                backgroundColor: c.surface,
                borderColor: unreadAlerts > 0 ? c.dangerBorder : c.border,
              },
            ]}
          >
            <Bell
              size={14}
              color={unreadAlerts > 0 ? c.error : c.textTertiary}
              style={{ marginBottom: 4 }}
            />
            <Text
              style={[
                styles.quickPillValue,
                { color: unreadAlerts > 0 ? c.error : c.textDim },
              ]}
            >
              {unreadAlerts}
            </Text>
            <Text style={[styles.quickPillLabel, { color: c.textDark }]}>
              ALERTS
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedCard>

      {/* Active OD Trips */}
      {activeTrips.map((trip, idx) => {
        const tripColor = odColors[trip.status] || c.primary
        return (
          <AnimatedCard key={trip.id} delay={100 + idx * 50}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ODTracker')}
              style={[
                styles.odTripCard,
                {
                  backgroundColor: c.surface,
                  borderColor: tripColor + '30',
                },
              ]}
            >
              <View
                style={[
                  styles.odTripIcon,
                  { backgroundColor: tripColor + '15' },
                ]}
              >
                <Navigation size={20} color={tripColor} />
              </View>
              <View style={styles.odTripInfo}>
                <Text
                  style={[styles.odTripDest, { color: c.text }]}
                  numberOfLines={1}
                >
                  {trip.destinationName}
                </Text>
                <Text style={[styles.odTripMeta, { color: c.textDim }]}>
                  {trip.departedAt
                    ? `Departed ${new Date(trip.departedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                    : 'Departure pending'}
                </Text>
              </View>
              <View
                style={[
                  styles.odTripBadge,
                  { backgroundColor: tripColor + '15' },
                ]}
              >
                <Text
                  style={[styles.odTripBadgeText, { color: tripColor }]}
                >
                  {trip.status.replace(/_/g, ' ')}
                </Text>
              </View>
              <ChevronRight size={18} color={c.textDarkest} />
            </TouchableOpacity>
          </AnimatedCard>
        )
      })}

      {/* Today's Meals */}
      <AnimatedCard delay={200}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Food')}
          style={[
            styles.sectionCard,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textTertiary }]}>
              TODAY'S MEALS
            </Text>
            {missed.length > 0 && (
              <View style={[styles.missedBadge, { backgroundColor: c.dangerBg }]}>
                <Text style={[styles.missedBadgeText, { color: c.error }]}>
                  {missed.length} skipped
                </Text>
              </View>
            )}
          </View>
          <View style={styles.mealGrid}>
            {mealTypes.map((m) => {
              const eaten = loggedMeals.has(m)
              const isMissed = expected.includes(m) && !eaten
              const upcoming = !expected.includes(m) && !eaten
              const food = todayMeals.find((f) => f.mealType === m)
              const accent = eaten
                ? c.success
                : isMissed
                  ? c.error
                  : c.textDarkest
              const MealIcon = MEAL_ICONS[m]
              return (
                <View
                  key={m}
                  style={[styles.mealSlot, upcoming && { opacity: 0.3 }]}
                >
                  <View
                    style={[
                      styles.mealIconBox,
                      {
                        backgroundColor: accent + '15',
                        borderColor: accent + '30',
                      },
                    ]}
                  >
                    <MealIcon size={16} color={accent} />
                    {food && (
                      <Text style={[styles.mealAmount, { color: accent }]}>
                        {'\u20B9'}
                        {food.amount}
                      </Text>
                    )}
                    {isMissed && (
                      <AlertTriangle
                        size={10}
                        color={c.error}
                        style={{ marginTop: 2 }}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.mealLabel,
                      {
                        color: eaten ? c.textTertiary : c.textDarkest,
                      },
                    ]}
                  >
                    {MEAL_LABELS[m]}
                  </Text>
                  {food && (
                    <Text
                      style={[styles.mealItems, { color: c.textDark }]}
                      numberOfLines={1}
                    >
                      {food.items.split(',')[0].split('(')[0].trim()}
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
        </TouchableOpacity>
      </AnimatedCard>

      {/* CampusOne Spending */}
      <AnimatedCard delay={250}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Expenses')}
          style={[
            styles.sectionCard,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Wallet size={14} color={c.textTertiary} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: c.textTertiary }]}>
                CAMPUSONE
              </Text>
            </View>
            <ChevronRight size={18} color={c.textDarkest} />
          </View>
          <View style={styles.spendingHeader}>
            <View>
              <Text style={[styles.spendingAmount, { color: c.primary }]}>
                {'\u20B9'}
                {totalSpent}
              </Text>
              <Text style={[styles.spendingLabel, { color: c.textDark }]}>
                spent today
              </Text>
            </View>
            <View style={styles.spendingBalanceWrap}>
              <Text
                style={[styles.spendingBalance, { color: c.textTertiary }]}
              >
                {'\u20B9'}
                {expenses?.balance?.toLocaleString('en-IN') || '0'}
              </Text>
              <Text style={[styles.spendingLabel, { color: c.textDark }]}>
                balance
              </Text>
            </View>
          </View>
          {todayTxns.length > 0 && (
            <View style={[styles.txnList, { borderTopColor: c.border }]}>
              {todayTxns.slice(0, 3).map((t, i) => (
                <View
                  key={t.id}
                  style={[
                    styles.txnRow,
                    i < Math.min(todayTxns.length, 3) - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: c.borderLight,
                    },
                  ]}
                >
                  <View
                    style={[styles.txnDot, { backgroundColor: c.primary }]}
                  />
                  <View style={styles.txnInfo}>
                    <Text
                      style={[styles.txnDesc, { color: c.textSecondary }]}
                      numberOfLines={1}
                    >
                      {t.description}
                    </Text>
                    <Text style={[styles.txnMeta, { color: c.textDarkest }]}>
                      {t.vendor} {'\u00B7'}{' '}
                      {new Date(t.transactionAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.txnAmount, { color: c.primary }]}>
                    {'\u20B9'}
                    {t.amount}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </AnimatedCard>

      {/* Activity Timeline */}
      {campusStatus && campusStatus.todayCheckIns.length > 0 && (
        <AnimatedCard delay={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: c.textTertiary, marginBottom: 12 },
              ]}
            >
              ACTIVITY
            </Text>
            <View style={styles.timelineContainer}>
              <View
                style={[
                  styles.timelineLine,
                  { backgroundColor: c.borderLight },
                ]}
              />
              {campusStatus.todayCheckIns.slice(0, 5).map((ci, i) => {
                const isEntry =
                  ci.type === 'CAMPUS_ENTRY' || ci.type === 'AUTO'
                const dotColor = isEntry ? c.success : c.error
                return (
                  <View key={ci.id} style={styles.timelineRow}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: dotColor },
                        i === 0 && {
                          shadowColor: dotColor,
                          shadowOpacity: 0.6,
                          shadowRadius: 4,
                          elevation: 4,
                        },
                      ]}
                    />
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineLabelRow}>
                        {isEntry ? (
                          <Check
                            size={12}
                            color={c.success}
                            style={{ marginRight: 6 }}
                          />
                        ) : (
                          <AlertTriangle
                            size={12}
                            color={c.error}
                            style={{ marginRight: 6 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.timelineLabel,
                            { color: c.textSecondary },
                          ]}
                        >
                          {isEntry ? 'Entered campus' : 'Left campus'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.timelineTime,
                          { color: c.textDarkest },
                        ]}
                      >
                        {new Date(ci.createdAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        </AnimatedCard>
      )}

      {/* Alerts section removed - alerts come from separate endpoint */}

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
    gap: 6,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headerName: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },

  // Quick glance pills
  quickGlanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickPillValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  quickPillLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },

  // Geofence status card
  geofenceCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  geofenceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  geofenceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geofenceInfo: {
    flex: 1,
    minWidth: 0,
  },
  geofenceTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  geofenceMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  alertBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  curfewWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  curfewWarningText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Active OD trip cards
  odTripCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  odTripIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  odTripInfo: {
    flex: 1,
    minWidth: 0,
  },
  odTripDest: {
    fontSize: 14,
    fontWeight: '700',
  },
  odTripMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  odTripBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  odTripBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Section card
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Meals
  missedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  missedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  mealGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mealSlot: {
    flex: 1,
    alignItems: 'center',
  },
  mealIconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  mealAmount: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  mealLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  mealItems: {
    fontSize: 8,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 2,
  },

  // Campus spending
  spendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  spendingAmount: {
    fontSize: 24,
    fontWeight: '900',
  },
  spendingLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  spendingBalanceWrap: {
    alignItems: 'flex-end',
  },
  spendingBalance: {
    fontSize: 14,
    fontWeight: '700',
  },
  txnList: {
    borderTopWidth: 1,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  txnDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  txnInfo: {
    flex: 1,
    minWidth: 0,
  },
  txnDesc: {
    fontSize: 12,
  },
  txnMeta: {
    fontSize: 9,
    marginTop: 1,
  },
  txnAmount: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Activity timeline
  timelineContainer: {
    marginLeft: 8,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 4,
    top: 8,
    bottom: 8,
    width: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 12,
  },
  timelineTime: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },

  // Alerts
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  alertInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  alertTime: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
})
