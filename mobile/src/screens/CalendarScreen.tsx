import React, { useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { getCalendarEvents } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import { formatDate } from '../utils/format'
import Animated, { FadeInDown } from 'react-native-reanimated'

export function CalendarScreen() {
  const { c, spacing } = useTheme()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['calendar'],
    queryFn: getCalendarEvents,
  })

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        list: { padding: spacing.md, gap: spacing.sm },
        card: {
          backgroundColor: c.surface,
          borderRadius: 12,
          padding: spacing.md,
          flexDirection: 'row',
          gap: spacing.md,
        },
        dateBox: {
          width: 50,
          height: 50,
          borderRadius: 12,
          backgroundColor: c.primaryLight + '20',
          alignItems: 'center',
          justifyContent: 'center',
        },
        dateDay: { fontSize: 20, fontWeight: '800', color: c.primary },
        dateMonth: { fontSize: 10, fontWeight: '600', color: c.primary, textTransform: 'uppercase' },
        info: { flex: 1 },
        title: { fontSize: 15, fontWeight: '600', color: c.text },
        description: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
        meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
        typeBadge: {
          backgroundColor: c.surfaceVariant,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
        },
        typeText: { fontSize: 10, fontWeight: '600', color: c.textSecondary },
        dateRange: { fontSize: 11, color: c.textTertiary },
      }),
    [c, spacing],
  )

  if (isLoading) return <LoadingScreen />

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      ListEmptyComponent={<EmptyState icon="calendar" title="No upcoming events" />}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.duration(400).delay(index * 60).springify().damping(18).stiffness(180)} style={styles.card}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>
              {new Date(item.startDate).getDate()}
            </Text>
            <Text style={styles.dateMonth}>
              {new Date(item.startDate).toLocaleString('default', { month: 'short' })}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{item.title}</Text>
            {item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.meta}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
              {item.endDate && (
                <Text style={styles.dateRange}>
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    />
  )
}
