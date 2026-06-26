import React, { useMemo } from 'react'
import { View, Text, ScrollView, RefreshControl, Dimensions } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { BarChart, PieChart } from 'react-native-chart-kit'
import {
  Wallet,
  UtensilsCrossed,
  Pencil,
  Printer,
  PartyPopper,
  Bus,
  Package,
} from 'lucide-react-native'
import { getStudentExpenses, getDashboard } from '../api/endpoints'
import { Card } from '../components/Card'
import { LoadingScreen } from '../components/LoadingScreen'
import { StudentSelector } from '../components/StudentSelector'
import { useStudentSelector } from '../hooks/useStudentSelector'
import { useTheme } from '../hooks/useTheme'
import { AnimatedCard } from '../components/AnimatedCard'
import { formatDateTime } from '../utils/format'

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#FAFAFA',
  STATIONERY: '#A1A1AA',
  PRINTING: '#E4E4E7',
  EVENT: '#71717A',
  TRANSPORT: '#D4D4D8',
  OTHER: '#52525B',
}

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  FOOD: UtensilsCrossed,
  STATIONERY: Pencil,
  PRINTING: Printer,
  EVENT: PartyPopper,
  TRANSPORT: Bus,
  OTHER: Package,
}


export function ExpensesScreen() {
  const { c, spacing } = useTheme()
  const screenWidth = Dimensions.get('window').width - spacing.md * 4

  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const students = dashboard?.students || []
  const { selectedStudentId, selectStudent } = useStudentSelector(students)

  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  const { data: expenses, isLoading, refetch } = useQuery({
    queryKey: ['expenses', selectedStudentId],
    queryFn: () => getStudentExpenses(selectedStudentId),
    enabled: !!selectedStudentId,
  })

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: c.surface,
      backgroundGradientTo: c.surface,
      color: (opacity = 1) => {
        // Extract RGB from c.primary hex
        const hex = c.primary.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
      },
      labelColor: () => c.textMuted,
      barPercentage: 0.6,
      decimalPlaces: 0,
      propsForLabels: { fontSize: 11 },
    }),
    [c]
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
      summaryRow: {
        gap: spacing.sm,
      },
      summaryRowTwo: {
        flexDirection: 'row' as const,
        gap: spacing.sm,
      },
      summaryCard: {
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        padding: spacing.md + 4,
      },
      summaryCardHalf: {
        flex: 1,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        padding: spacing.md + 4,
      },
      balanceHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 8,
      },
      connectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
      },
      connectionText: {
        fontSize: 10,
        color: c.textMuted,
        marginTop: 4,
      },
      summaryLabel: {
        fontSize: 10,
        color: c.textMuted,
        fontWeight: '600' as const,
        letterSpacing: 1,
        marginBottom: 8,
      },
      summaryValue: {
        fontSize: 24,
        fontWeight: '700' as const,
        color: c.textLight,
      },
      goldRupee: {
        color: c.primary,
      },
      chart: {
        borderRadius: 12,
        marginLeft: -spacing.sm,
      },
      categorySection: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
      },
      legendContainer: {
        flex: 1,
        gap: 8,
        paddingLeft: spacing.sm,
      },
      legendRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      },
      legendLeft: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
      },
      legendDot: {
        width: 12,
        height: 12,
        borderRadius: 2,
      },
      legendLabel: {
        fontSize: 11,
        color: c.textSecondary,
      },
      legendValue: {
        fontSize: 11,
        color: c.textLight,
        fontWeight: '500' as const,
      },
      txRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingVertical: spacing.sm + 4,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        gap: 12,
      },
      txIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
      },
      txDetails: {
        flex: 1,
        minWidth: 0,
      },
      txVendor: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: c.textLight,
      },
      txDesc: {
        fontSize: 12,
        color: c.textMuted,
        marginTop: 2,
      },
      txRight: {
        alignItems: 'flex-end' as const,
        flexShrink: 0,
      },
      txAmount: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: c.error,
      },
      txTime: {
        fontSize: 10,
        color: c.textMuted,
        marginTop: 2,
      },
      emptyText: {
        fontSize: 14,
        color: c.textMuted,
        textAlign: 'center' as const,
        padding: spacing.lg,
      },
      noDataContainer: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        padding: spacing.xxl,
      },
      noDataTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: c.text,
        textAlign: 'center' as const,
        marginTop: spacing.md,
      },
    }),
    [c, spacing]
  )

  if (isLoading && !expenses) return <LoadingScreen />
  if (!expenses)
    return (
      <View style={s.noDataContainer}>
        <Wallet size={48} color={c.textMuted} />
        <Text style={s.noDataTitle}>No expense data</Text>
      </View>
    )

  // Weekly spending by day
  const dailySpending: Record<string, number> = {}
  const dayLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    dailySpending[key] = 0
    dayLabels.push(label)
  }
  expenses.transactions.forEach((t: any) => {
    const key = new Date(t.transactionAt).toISOString().split('T')[0]
    if (dailySpending[key] !== undefined) dailySpending[key] += t.amount
  })

  // Category breakdown
  const byCat: Record<string, number> = {}
  expenses.transactions.forEach((t: any) => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount
  })
  const pieData = Object.entries(byCat).map(([name, amount]) => ({
    name,
    amount,
    color: CATEGORY_COLORS[name] || '#52525B',
    legendFontColor: c.textSecondary,
    legendFontSize: 12,
  }))

  const isConnected = expenses.balance > 0

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
            <Wallet size={24} color={c.primary} />
            <Text style={s.headerTitle}>CampusOne Expenses</Text>
          </View>
          <Text style={s.headerSubtitle}>
            {selectedStudent?.name || 'Student'} - Campus spending overview
          </Text>
        </View>
      </Animated.View>

      {/* Balance Card */}
      <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)}>
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <View style={s.balanceHeader}>
              <Text style={s.summaryLabel}>CAMPUSONE BALANCE</Text>
              <View style={[s.connectionDot, { backgroundColor: isConnected ? c.success : c.error }]} />
            </View>
            <Text style={s.summaryValue}>
              <Text style={s.goldRupee}>{'\u20B9'}</Text>
              {expenses.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={s.connectionText}>
              {isConnected ? 'Account connected' : 'Account disconnected'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Today + Week Cards */}
      <Animated.View entering={FadeInDown.duration(400).delay(120).springify().damping(18).stiffness(180)}>
      <View style={s.summaryRowTwo}>
        <View style={s.summaryCardHalf}>
          <Text style={s.summaryLabel}>TODAY'S SPENDING</Text>
          <Text style={s.summaryValue}>
            <Text style={s.goldRupee}>{'\u20B9'}</Text>
            {expenses.todaySpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={s.summaryCardHalf}>
          <Text style={s.summaryLabel}>THIS WEEK</Text>
          <Text style={s.summaryValue}>
            <Text style={s.goldRupee}>{'\u20B9'}</Text>
            {expenses.weekSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
      </Animated.View>

      {/* Weekly Bar Chart */}
      {Object.values(dailySpending).some((v) => v > 0) && (
        <AnimatedCard delay={0}>
          <Card title="Daily Spending (This Week)">
            <BarChart
              data={{
                labels: dayLabels,
                datasets: [{ data: Object.values(dailySpending) }],
              }}
              width={screenWidth}
              height={220}
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

      {/* Category Pie Chart + Legend */}
      {pieData.length > 0 && (
        <AnimatedCard delay={200}>
          <Card title="Category Breakdown">
            <View style={s.categorySection}>
              <PieChart
                data={pieData}
                width={screenWidth * 0.5}
                height={180}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="0"
                hasLegend={false}
                center={[screenWidth * 0.125, 0]}
              />
              <View style={s.legendContainer}>
                {pieData.map((entry) => {
                  const IconComp = CATEGORY_ICONS[entry.name] || Package
                  return (
                    <View key={entry.name} style={s.legendRow}>
                      <View style={s.legendLeft}>
                        <View style={[s.legendDot, { backgroundColor: entry.color }]} />
                        <IconComp size={12} color={c.textSecondary} />
                        <Text style={s.legendLabel}>{entry.name}</Text>
                      </View>
                      <Text style={s.legendValue}>
                        {'\u20B9'}{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          </Card>
        </AnimatedCard>
      )}

      {/* Transaction History */}
      <Animated.View entering={FadeInDown.duration(400).delay(180).springify().damping(18).stiffness(180)}>
      <Card title="Transaction History">
        {expenses.transactions.length === 0 && (
          <Text style={s.emptyText}>No transactions found</Text>
        )}
        {expenses.transactions.slice(0, 20).map((t: any) => {
          const IconComp = CATEGORY_ICONS[t.category] || Package
          const catColor = CATEGORY_COLORS[t.category] || '#52525B'
          return (
            <View key={t.id} style={s.txRow}>
              <View style={[s.txIconContainer, { backgroundColor: catColor + '1A' }]}>
                <IconComp size={18} color={catColor} />
              </View>

              <View style={s.txDetails}>
                <Text style={s.txVendor} numberOfLines={1}>{t.vendor}</Text>
                <Text style={s.txDesc} numberOfLines={1}>{t.description}</Text>
              </View>

              <View style={s.txRight}>
                <Text style={s.txAmount}>
                  -{'\u20B9'}{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={s.txTime}>{formatDateTime(t.transactionAt)}</Text>
              </View>
            </View>
          )
        })}
      </Card>
      </Animated.View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}
