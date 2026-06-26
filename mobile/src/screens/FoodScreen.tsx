import React, { useMemo } from 'react'
import { View, Text, ScrollView, RefreshControl, Dimensions } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { BarChart } from 'react-native-chart-kit'
import {
  UtensilsCrossed,
  Coffee,
  Cookie,
  Moon,
  AlertCircle,
} from 'lucide-react-native'
import { getStudentFoodLog, getDashboard } from '../api/endpoints'
import { Card } from '../components/Card'
import { LoadingScreen } from '../components/LoadingScreen'
import { StudentSelector } from '../components/StudentSelector'
import { useStudentSelector } from '../hooks/useStudentSelector'
import { useTheme } from '../hooks/useTheme'
import { AnimatedCard } from '../components/AnimatedCard'
import { formatDateTime } from '../utils/format'

const MEAL_CONFIG: Record<
  string,
  { label: string; window: string; Icon: React.ComponentType<any>; order: number }
> = {
  BREAKFAST: { label: 'Breakfast', window: '7:00 AM - 10:00 AM', Icon: Coffee, order: 0 },
  LUNCH: { label: 'Lunch', window: '12:00 PM - 2:00 PM', Icon: UtensilsCrossed, order: 1 },
  SNACKS: { label: 'Snacks', window: '3:00 PM - 5:00 PM', Icon: Cookie, order: 2 },
  DINNER: { label: 'Dinner', window: '7:00 PM - 9:00 PM', Icon: Moon, order: 3 },
}

const MEAL_HOURS: Record<string, { start: number; end: number }> = {
  BREAKFAST: { start: 7, end: 10 },
  LUNCH: { start: 12, end: 14 },
  SNACKS: { start: 15, end: 17 },
  DINNER: { start: 19, end: 21 },
}

const allMealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']

function getNutritionColor(mealCount: number, c: { success: string; warning: string; error: string }) {
  if (mealCount >= 3) return c.success
  if (mealCount === 2) return c.warning
  return c.error
}

function getNutritionLabel(mealCount: number) {
  if (mealCount >= 3) return 'Good'
  if (mealCount === 2) return 'Fair'
  return 'Poor'
}


export function FoodScreen() {
  const { c, spacing } = useTheme()
  const screenWidth = Dimensions.get('window').width - spacing.md * 4

  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const students = dashboard?.students || []
  const { selectedStudentId, selectStudent } = useStudentSelector(students)

  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  const { data: foodLog, isLoading, refetch } = useQuery({
    queryKey: ['foodLog', selectedStudentId],
    queryFn: () => getStudentFoodLog(selectedStudentId),
    enabled: !!selectedStudentId,
  })

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  // Extract RGB components from a hex color for use in rgba()
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return { r, g, b }
  }

  const primaryRgb = hexToRgb(c.primary)
  const primaryDarkRgb = hexToRgb(c.primaryDark)

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: c.surface,
      backgroundGradientTo: c.surface,
      color: (opacity = 1) => `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${opacity})`,
      labelColor: () => c.textMuted,
      barPercentage: 0.6,
      decimalPlaces: 0,
      propsForLabels: { fontSize: 11 },
    }),
    [c, primaryRgb]
  )

  const mealsPerDayChartConfig = useMemo(
    () => ({
      ...chartConfig,
      color: (opacity = 1) =>
        `rgba(${primaryDarkRgb.r}, ${primaryDarkRgb.g}, ${primaryDarkRgb.b}, ${opacity})`,
    }),
    [chartConfig, primaryDarkRgb]
  )

  const s = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      content: {
        padding: spacing.md,
        gap: spacing.md,
      },
      header: {
        marginBottom: 4,
      },
      headerRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 10,
      },
      headerTitle: {
        fontSize: 24,
        fontWeight: '700' as const,
        color: c.textLight,
      },
      headerSubtitle: {
        fontSize: 14,
        color: c.textSecondary,
        marginTop: 4,
      },

      // Summary grid (2x2)
      summaryGrid: {
        gap: spacing.sm,
      },
      summaryGridRow: {
        flexDirection: 'row' as const,
        gap: spacing.sm,
      },
      summaryCard: {
        flex: 1,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        padding: spacing.md,
      },
      summaryLabel: {
        fontSize: 10,
        color: c.textMuted,
        fontWeight: '600' as const,
        letterSpacing: 1,
        marginBottom: 6,
      },
      summaryValue: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: c.textLight,
      },
      goldRupee: {
        color: c.primary,
      },
      nutritionRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
      },
      nutritionDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
      },
      nutritionHint: {
        fontSize: 9,
        color: c.textMuted,
        marginTop: 4,
      },

      // Timeline
      timeline: {
        position: 'relative' as const,
        paddingLeft: 32,
      },
      timelineLine: {
        position: 'absolute' as const,
        left: 13,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: c.border,
      },
      timelineItem: {
        marginBottom: 20,
        position: 'relative' as const,
      },
      timelineDot: {
        position: 'absolute' as const,
        left: -24,
        top: 16,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
      },

      // Eaten card
      eatenCard: {
        backgroundColor: c.surfaceVariant,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 8,
        padding: spacing.md,
      },
      eatenLabel: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: c.textLight,
      },

      // Missed card
      missedCard: {
        backgroundColor: c.warningLight,
        borderWidth: 1,
        borderColor: c.warningBorder,
        borderRadius: 8,
        padding: spacing.md,
      },
      missedLabel: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: c.warning,
      },
      missedBadge: {
        fontSize: 9,
        fontWeight: '700' as const,
        color: c.warning,
        letterSpacing: 1,
        marginLeft: 6,
      },
      missedHint: {
        fontSize: 12,
        color: c.warning,
        opacity: 0.7,
        marginTop: 6,
      },

      // Upcoming card
      upcomingCard: {
        borderWidth: 1,
        borderColor: c.border,
        borderStyle: 'dashed' as const,
        borderRadius: 8,
        padding: spacing.md,
      },
      upcomingLabel: {
        fontSize: 14,
        color: c.textMuted,
      },

      // Shared meal card parts
      mealCardHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
      },
      mealLabelRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
      },
      mealWindow: {
        fontSize: 11,
        color: c.textMuted,
      },
      mealDetail: {
        marginTop: 10,
        paddingLeft: 26,
      },
      mealDetailTop: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
      },
      mealItems: {
        fontSize: 14,
        color: c.textLight,
        flex: 1,
        marginRight: 8,
      },
      mealPrice: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: c.primary,
      },
      mealDetailBottom: {
        flexDirection: 'row' as const,
        gap: 12,
        marginTop: 4,
      },
      mealVendor: {
        fontSize: 11,
        color: c.textMuted,
      },
      mealTime: {
        fontSize: 11,
        color: c.textMuted,
      },

      // Chart
      chart: {
        borderRadius: 12,
        marginLeft: -spacing.sm,
      },

      // Nutrition dots row below meals-per-day chart
      nutritionDotsRow: {
        flexDirection: 'row' as const,
        justifyContent: 'space-around' as const,
        marginTop: 12,
        paddingHorizontal: 8,
      },
      nutritionDotCol: {
        alignItems: 'center' as const,
        gap: 4,
      },
      nutritionDotSmall: {
        width: 10,
        height: 10,
        borderRadius: 5,
      },
      nutritionDotLabel: {
        fontSize: 9,
        color: c.textMuted,
      },

      // Empty state
      noDataContainer: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        padding: spacing.xxl,
        backgroundColor: c.background,
      },
      noDataTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: c.text,
        textAlign: 'center' as const,
        marginTop: spacing.md,
      },
      noDataMessage: {
        fontSize: 14,
        color: c.textMuted,
        textAlign: 'center' as const,
        marginTop: spacing.xs,
      },
    }),
    [c, spacing]
  )

  if (isLoading && !foodLog) return <LoadingScreen />

  const logs = foodLog || []
  const today = new Date()
  const currentHour = today.getHours()
  const todayLogs = logs.filter((f: any) => new Date(f.loggedAt).toDateString() === today.toDateString())
  const todaySpend = todayLogs.reduce((sum: number, f: any) => sum + f.amount, 0)
  const todayMealCount = todayLogs.length

  // Determine missed meals (meal window has passed but no log)
  const missedMeals = allMealTypes.filter((type) => {
    const hours = MEAL_HOURS[type]
    const hasMeal = todayLogs.find((f: any) => f.mealType === type)
    return !hasMeal && currentHour >= hours.end
  })

  // Group today's meals by type
  const mealsByType: Record<string, any[]> = {}
  for (const m of todayLogs) {
    if (!mealsByType[(m as any).mealType]) mealsByType[(m as any).mealType] = []
    mealsByType[(m as any).mealType].push(m)
  }

  const nutritionColor = getNutritionColor(todayMealCount, c)

  // Weekly food spend by day
  const dailySpend: Record<string, number> = {}
  const dailyMeals: Record<string, number> = {}
  const dayLabels: string[] = []
  const dailyMealCounts: { day: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    dailySpend[key] = 0
    dailyMeals[key] = 0
    dayLabels.push(label)
  }
  logs.forEach((f: any) => {
    const key = new Date(f.loggedAt).toISOString().split('T')[0]
    if (dailySpend[key] !== undefined) {
      dailySpend[key] += f.amount
      dailyMeals[key]++
    }
  })
  const mealCountValues = Object.values(dailyMeals)
  Object.keys(dailyMeals).forEach((key, idx) => {
    dailyMealCounts.push({ day: dayLabels[idx], count: dailyMeals[key] })
  })

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
    >
      <StudentSelector students={students} selectedId={selectedStudentId} onSelect={selectStudent} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)}>
        <View style={s.header}>
          <View style={s.headerRow}>
            <UtensilsCrossed size={24} color={c.primary} />
            <Text style={s.headerTitle}>Food Monitor</Text>
          </View>
          <Text style={s.headerSubtitle}>
            {selectedStudent?.name || 'Student'} - Meal tracking and nutrition
          </Text>
        </View>
      </Animated.View>

      {/* 4 Summary Cards (2x2 grid) */}
      <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)}>
      <View style={s.summaryGrid}>
        <View style={s.summaryGridRow}>
          {/* Today's Spend */}
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>TODAY'S FOOD SPEND</Text>
            <Text style={s.summaryValue}>
              <Text style={s.goldRupee}>{'\u20B9'}</Text>
              {todaySpend.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </Text>
          </View>

          {/* Meals Today */}
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>MEALS TODAY</Text>
            <Text style={s.summaryValue}>{todayMealCount}</Text>
          </View>
        </View>

        <View style={s.summaryGridRow}>
          {/* Missed */}
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>MISSED</Text>
            <Text
              style={[
                s.summaryValue,
                { color: missedMeals.length > 0 ? c.warning : c.success },
              ]}
            >
              {missedMeals.length}
            </Text>
          </View>

          {/* Nutrition Indicator */}
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>NUTRITION</Text>
            <View style={s.nutritionRow}>
              <View style={[s.nutritionDot, { backgroundColor: nutritionColor }]} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: nutritionColor }}>
                {getNutritionLabel(todayMealCount)}
              </Text>
            </View>
            <Text style={s.nutritionHint}>3+ meals = good, 2 = fair, 1 = poor</Text>
          </View>
        </View>
      </View>
      </Animated.View>

      {/* Meal Timeline */}
      <Animated.View entering={FadeInDown.duration(400).delay(120).springify().damping(18).stiffness(180)}>
      <Card title="Today's Meals">
        <View style={s.timeline}>
          {/* Vertical timeline line */}
          <View style={s.timelineLine} />

          {allMealTypes.map((mealType, index) => {
            const config = MEAL_CONFIG[mealType]
            const hours = MEAL_HOURS[mealType]
            const meals = mealsByType[mealType] || []
            const isMissed = missedMeals.includes(mealType)
            const isUpcoming = currentHour < hours.start
            const isCurrent = currentHour >= hours.start && currentHour < hours.end
            const { Icon } = config

            // Dot colors
            const dotBorderColor = isMissed
              ? c.warning
              : meals.length > 0
                ? c.success
                : isUpcoming
                  ? c.border
                  : isCurrent
                    ? c.primary
                    : c.border
            const dotFillColor = meals.length > 0 ? c.success : 'transparent'

            return (
              <AnimatedCard key={mealType} delay={index * 100}>
              <View style={s.timelineItem}>
                {/* Timeline dot */}
                <View
                  style={[
                    s.timelineDot,
                    {
                      borderColor: dotBorderColor,
                      backgroundColor: dotFillColor,
                    },
                  ]}
                />

                {/* Meal Content */}
                {isMissed ? (
                  <View style={s.missedCard}>
                    <View style={s.mealCardHeader}>
                      <View style={s.mealLabelRow}>
                        <Icon size={18} color={c.warning} />
                        <Text style={s.missedLabel}>{config.label}</Text>
                        <Text style={s.missedBadge}>MISSED</Text>
                      </View>
                      <Text style={s.mealWindow}>{config.window}</Text>
                    </View>
                    <Text style={s.missedHint}>
                      Meal window has passed with no food log recorded.
                    </Text>
                  </View>
                ) : meals.length > 0 ? (
                  <View style={s.eatenCard}>
                    <View style={s.mealCardHeader}>
                      <View style={s.mealLabelRow}>
                        <Icon size={18} color={c.success} />
                        <Text style={s.eatenLabel}>{config.label}</Text>
                      </View>
                      <Text style={s.mealWindow}>{config.window}</Text>
                    </View>
                    {meals.map((meal: any) => (
                      <View key={meal.id} style={s.mealDetail}>
                        <View style={s.mealDetailTop}>
                          <Text style={s.mealItems} numberOfLines={1}>{meal.items}</Text>
                          <Text style={s.mealPrice}>{'\u20B9'}{meal.amount}</Text>
                        </View>
                        <View style={s.mealDetailBottom}>
                          <Text style={s.mealVendor}>{meal.vendor}</Text>
                          <Text style={s.mealTime}>{formatDateTime(meal.loggedAt)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={[s.upcomingCard, isUpcoming && { opacity: 0.4 }]}>
                    <View style={s.mealCardHeader}>
                      <View style={s.mealLabelRow}>
                        <View style={isUpcoming ? { opacity: 0.4 } : undefined}>
                          <Icon size={18} color={isUpcoming ? c.textMuted : c.primary} />
                        </View>
                        <Text style={s.upcomingLabel}>
                          {config.label}
                          {isUpcoming && ' - Upcoming'}
                          {isCurrent && ' - In Progress'}
                        </Text>
                      </View>
                      <Text style={s.mealWindow}>{config.window}</Text>
                    </View>
                  </View>
                )}
              </View>
              </AnimatedCard>
            )
          })}
        </View>
      </Card>
      </Animated.View>

      {/* Weekly Food Spend Chart */}
      {Object.values(dailySpend).some((v) => v > 0) && (
        <AnimatedCard delay={0}>
          <Card title="Weekly Food Spend">
            <BarChart
              data={{
                labels: dayLabels,
                datasets: [{ data: Object.values(dailySpend) }],
              }}
              width={screenWidth}
              height={200}
              chartConfig={chartConfig}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel={'\u20B9'}
              yAxisSuffix=""
              style={s.chart}
            />
          </Card>
        </AnimatedCard>
      )}

      {/* Meals Per Day Chart */}
      {mealCountValues.some((v) => v > 0) && (
        <AnimatedCard delay={200}>
          <Card title="Meals Per Day (This Week)">
            <BarChart
              data={{
                labels: dayLabels,
                datasets: [{ data: mealCountValues.map((v) => (v === 0 ? 0.01 : v)) }],
              }}
              width={screenWidth}
              height={160}
              chartConfig={mealsPerDayChartConfig}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel=""
              yAxisSuffix=""
              style={s.chart}
            />
            {/* Nutrition color dots below chart */}
            <View style={s.nutritionDotsRow}>
              {dailyMealCounts.map((d) => (
                <View key={d.day} style={s.nutritionDotCol}>
                  <View
                    style={[
                      s.nutritionDotSmall,
                      { backgroundColor: getNutritionColor(d.count, c) },
                    ]}
                  />
                  <Text style={s.nutritionDotLabel}>{d.day}</Text>
                </View>
              ))}
            </View>
          </Card>
        </AnimatedCard>
      )}

      {logs.length === 0 && (
        <View style={s.noDataContainer}>
          <UtensilsCrossed size={48} color={c.textMuted} />
          <Text style={s.noDataTitle}>No food logs</Text>
          <Text style={s.noDataMessage}>No meal data available yet.</Text>
        </View>
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}
