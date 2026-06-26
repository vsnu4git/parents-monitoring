import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { IndianRupee, Calendar, Hash } from 'lucide-react-native'
import { getAdminFees } from '../../api/endpoints'
import { LoadingScreen } from '../../components/LoadingScreen'
import { EmptyState } from '../../components/EmptyState'
import { useTheme } from '../../hooks/useTheme'
import { formatCurrency } from '../../utils/format'
import type { AdminFeeEntry } from '../../types/api'

const STATUS_FILTERS = ['ALL', 'PENDING', 'PAID', 'OVERDUE', 'PARTIAL'] as const

function getStatusColor(status: string, c: any) {
  switch (status) {
    case 'PAID':
      return c.success
    case 'PENDING':
      return c.warning
    case 'OVERDUE':
      return c.error
    case 'PARTIAL':
      return '#EAB308'
    default:
      return c.textSecondary
  }
}

export function AdminFeesScreen() {
  const { c, spacing } = useTheme()
  const [activeFilter, setActiveFilter] = useState<string>('ALL')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-fees', activeFilter],
    queryFn: () =>
      getAdminFees(activeFilter === 'ALL' ? undefined : { status: activeFilter }),
  })

  const fees = data?.fees ?? []
  const total = data?.total ?? 0

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        list: { padding: spacing.md, gap: spacing.sm },
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.xs,
        },
        headerTitle: { fontSize: 22, fontWeight: '700', color: c.text },
        headerCount: { fontSize: 13, color: c.textSecondary, fontWeight: '600' },
        filtersRow: {
          flexDirection: 'row',
          paddingHorizontal: spacing.md,
          gap: 8,
          paddingBottom: spacing.sm,
        },
        chip: {
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 20,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        },
        chipActive: {
          backgroundColor: c.primary,
          borderColor: c.primary,
        },
        chipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
        chipTextActive: { color: c.buttonText },
        card: {
          backgroundColor: c.surface,
          borderRadius: 14,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: c.border,
        },
        cardTopRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        studentName: { fontSize: 15, fontWeight: '700', color: c.text, flex: 1 },
        statusBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
        },
        statusText: { fontSize: 11, fontWeight: '700' },
        registerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginTop: 4,
        },
        registerText: { fontSize: 12, color: c.textSecondary },
        deptBadge: {
          backgroundColor: c.primaryLight + '20',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          marginLeft: 6,
        },
        deptText: { fontSize: 10, fontWeight: '600', color: c.primary },
        termRow: {
          marginTop: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        termText: { fontSize: 12, color: c.textSecondary },
        descText: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
        amountsRow: {
          flexDirection: 'row',
          marginTop: spacing.md,
          gap: spacing.lg,
        },
        amountBlock: {},
        amountLabel: { fontSize: 10, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
        amountValue: { fontSize: 16, fontWeight: '700', color: c.text, marginTop: 2 },
        dueDateRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginTop: spacing.sm,
        },
        dueText: { fontSize: 12, color: c.textSecondary },
      }),
    [c, spacing],
  )

  if (isLoading) return <LoadingScreen />

  const renderFeeCard = ({ item, index }: { item: AdminFeeEntry; index: number }) => {
    const statusColor = getStatusColor(item.status, c)
    const dueDate = new Date(item.dueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 60).springify().damping(18).stiffness(180)}
        style={styles.card}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.student.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.registerRow}>
          <Hash size={12} color={c.textSecondary} />
          <Text style={styles.registerText}>{item.student.registerNumber}</Text>
          <View style={styles.deptBadge}>
            <Text style={styles.deptText}>{item.student.department.code}</Text>
          </View>
        </View>

        <View style={styles.termRow}>
          <Text style={styles.termText}>{item.term}</Text>
        </View>
        {item.description ? (
          <Text style={styles.descText}>{item.description}</Text>
        ) : null}

        <View style={styles.amountsRow}>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.amountValue, { color: c.success }]}>
              {formatCurrency(item.paidAmount)}
            </Text>
          </View>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Due</Text>
            <Text style={[styles.amountValue, { color: c.error }]}>
              {formatCurrency(item.totalAmount - item.paidAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.dueDateRow}>
          <Calendar size={12} color={c.textSecondary} />
          <Text style={styles.dueText}>Due: {dueDate}</Text>
        </View>
      </Animated.View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Fee Records</Text>
        <Text style={styles.headerCount}>{total} total</Text>
      </View>

      <View style={styles.filtersRow}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.chip, activeFilter === filter && styles.chipActive]}
            onPress={() => setActiveFilter(filter)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, activeFilter === filter && styles.chipTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={fees}
        keyExtractor={(item) => item.id}
        renderItem={renderFeeCard}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="wallet" title="No fee records" message="No fees match the selected filter." />}
      />
    </View>
  )
}
