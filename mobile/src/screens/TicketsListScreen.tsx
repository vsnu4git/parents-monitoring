import React, { useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getParentTickets } from '../api/endpoints'
import { Card } from '../components/Card'
import { StatusChip } from '../components/StatusChip'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import { formatRelative } from '../utils/format'
import type { TicketsStackParamList } from '../types/navigation'

type Nav = NativeStackNavigationProp<TicketsStackParamList>

export function TicketsListScreen() {
  const { c, spacing } = useTheme()
  const navigation = useNavigation<Nav>()

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['tickets'],
    queryFn: getParentTickets,
  })

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        list: { padding: spacing.md, gap: spacing.sm },
        card: { marginBottom: 0 },
        row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
        subject: { fontSize: 15, fontWeight: '600', color: c.text },
        meta: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        footer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.sm,
        },
        time: { fontSize: 11, color: c.textTertiary },
        fab: {
          position: 'absolute',
          bottom: spacing.lg,
          right: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        },
        fabText: { color: c.buttonText, fontSize: 28, fontWeight: '400', marginTop: -2 },
      }),
    [c, spacing],
  )

  if (isLoading) return <LoadingScreen />

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)} style={{ flex: 1 }}>
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState icon="ticket" title="No tickets" message="Tap + to create one" />}
          renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
            style={styles.card}
          >
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subject}>{item.subject}</Text>
                <Text style={styles.meta}>
                  {item.category} {item.student ? `- ${item.student.name}` : ''}
                </Text>
              </View>
              <StatusChip status={item.status} small />
            </View>
            <View style={styles.footer}>
              <StatusChip status={item.priority} small />
              <Text style={styles.time}>{formatRelative(item.updatedAt)}</Text>
            </View>
          </Card>
        )}
        />
      </Animated.View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTicket')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}
