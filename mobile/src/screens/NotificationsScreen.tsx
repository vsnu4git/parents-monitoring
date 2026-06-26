import React, { useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { getNotifications } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { StatusChip } from '../components/StatusChip'
import { useTheme } from '../hooks/useTheme'
import { formatRelative } from '../utils/format'
import Animated, { FadeInDown } from 'react-native-reanimated'

export function NotificationsScreen() {
  const { c, spacing } = useTheme()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  })

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        list: { padding: spacing.md, gap: spacing.sm },
        item: {
          backgroundColor: c.surface,
          borderRadius: 12,
          padding: spacing.md,
        },
        itemUnread: { borderLeftWidth: 3, borderLeftColor: c.primary },
        row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
        dot: {
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: c.primary, marginTop: 6,
        },
        title: { fontSize: 14, color: c.text },
        titleBold: { fontWeight: '700' },
        message: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        time: { fontSize: 11, color: c.textTertiary, marginTop: spacing.xs, textAlign: 'right' },
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
      ListEmptyComponent={<EmptyState icon="bell" title="No notifications" />}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.duration(400).delay(index * 60).springify().damping(18).stiffness(180)} style={[styles.item, !item.isRead && styles.itemUnread]}>
          <View style={styles.row}>
            {!item.isRead && <View style={styles.dot} />}
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, !item.isRead && styles.titleBold]}>{item.title}</Text>
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            </View>
            <StatusChip status={item.priority} small />
          </View>
          <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
        </Animated.View>
      )}
    />
  )
}
