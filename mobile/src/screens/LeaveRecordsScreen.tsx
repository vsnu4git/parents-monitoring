import React, { useState, useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { getProfile, getLeaves } from '../api/endpoints'
import { StudentSelector } from '../components/StudentSelector'
import { StatusChip } from '../components/StatusChip'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import { formatDate } from '../utils/format'
import Animated, { FadeInDown } from 'react-native-reanimated'

export function LeaveRecordsScreen() {
  const { c, spacing } = useTheme()
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile })
  const studentId = selectedStudentId || profile?.students[0]?.id || ''

  const { data: leaves, isLoading, refetch } = useQuery({
    queryKey: ['leaves', studentId],
    queryFn: () => getLeaves(studentId),
    enabled: !!studentId,
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
        row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
        type: { fontSize: 14, fontWeight: '600', color: c.text },
        dates: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        reason: { fontSize: 13, color: c.text, marginTop: spacing.sm },
        remarks: { fontSize: 12, color: c.textTertiary, marginTop: spacing.xs, fontStyle: 'italic' },
      }),
    [c, spacing],
  )

  return (
    <View style={styles.container}>
      {profile && (
        <StudentSelector
          students={profile.students}
          selectedId={studentId}
          onSelect={setSelectedStudentId}
        />
      )}
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={leaves}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState icon="calendar" title="No leave records" />}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 60).springify().damping(18).stiffness(180)} style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.type}>{item.type.replace(/_/g, ' ')}</Text>
                  <Text style={styles.dates}>
                    {formatDate(item.startDate)} - {formatDate(item.endDate)}
                  </Text>
                </View>
                <StatusChip status={item.status} />
              </View>
              <Text style={styles.reason}>{item.reason}</Text>
              {item.remarks && <Text style={styles.remarks}>Remarks: {item.remarks}</Text>}
            </Animated.View>
          )}
        />
      )}
    </View>
  )
}
