import React, { useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotices, acknowledgeNotice } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import { formatDate } from '../utils/format'
import Animated, { FadeInDown } from 'react-native-reanimated'

export function NoticesScreen() {
  const { c, spacing } = useTheme()
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notices'],
    queryFn: getNotices,
  })

  const ackMutation = useMutation({
    mutationFn: acknowledgeNotice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notices'] }),
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
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        categoryBadge: {
          backgroundColor: c.primaryLight + '20',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
        },
        categoryText: { fontSize: 11, fontWeight: '600', color: c.primary },
        date: { fontSize: 11, color: c.textTertiary },
        title: { fontSize: 16, fontWeight: '700', color: c.text },
        content: { fontSize: 14, color: c.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
        acked: { fontSize: 12, color: c.success, fontWeight: '600', marginTop: spacing.sm },
        ackButton: {
          backgroundColor: c.primary,
          borderRadius: 8,
          paddingVertical: 8,
          alignItems: 'center',
          marginTop: spacing.md,
        },
        ackText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
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
      ListEmptyComponent={<EmptyState icon="clipboard" title="No notices" />}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.duration(400).delay(index * 60).springify().damping(18).stiffness(180)} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <Text style={styles.date}>{formatDate(item.publishedAt)}</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.content}>{item.content}</Text>
          {item.requiresAcknowledgement && (
            item.acknowledged ? (
              <Text style={styles.acked}>Acknowledged</Text>
            ) : (
              <TouchableOpacity
                style={styles.ackButton}
                onPress={() => ackMutation.mutate(item.id)}
                disabled={ackMutation.isPending}
              >
                <Text style={styles.ackText}>Acknowledge</Text>
              </TouchableOpacity>
            )
          )}
        </Animated.View>
      )}
    />
  )
}
