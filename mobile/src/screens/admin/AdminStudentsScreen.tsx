import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, GraduationCap, X } from 'lucide-react-native'
import { getAdminStudents, getAdminDepartments } from '../../api/endpoints'
import { LoadingScreen } from '../../components/LoadingScreen'
import { EmptyState } from '../../components/EmptyState'
import { useTheme } from '../../hooks/useTheme'
import type { AdminStudentEntry, Department } from '../../types/api'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'rgba(76,175,80,0.15)', text: '#4CAF50' },
  INACTIVE: { bg: 'rgba(229,57,53,0.15)', text: '#E53935' },
  GRADUATED: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  SUSPENDED: { bg: 'rgba(255,152,0,0.15)', text: '#FF9800' },
}

function getStatusStyle(status: string) {
  return STATUS_COLORS[status] ?? { bg: 'rgba(155,142,123,0.15)', text: '#9B8E7B' }
}

export function AdminStudentsScreen() {
  const { c, spacing } = useTheme()

  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState<string | null>(null)

  const {
    data: studentsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-students', selectedDept, search],
    queryFn: () =>
      getAdminStudents({
        department: selectedDept ?? undefined,
        search: search.trim() || undefined,
      }),
  })

  const { data: departments } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: getAdminDepartments,
  })

  const students = studentsData?.students ?? []
  const total = studentsData?.total ?? 0

  const showStudentDetail = useCallback((student: AdminStudentEntry) => {
    const parentInfo = student.parent
      ? `\nParent: ${student.parent.user.name}\nEmail: ${student.parent.user.email}`
      : '\nParent: Not assigned'

    Alert.alert(
      student.name,
      `Register No: ${student.registerNumber}\n` +
        `Department: ${student.department.name} (${student.department.code})\n` +
        `Year: ${student.year} | Sem: ${student.semester} | Sec: ${student.section}\n` +
        `Status: ${student.status}` +
        parentInfo,
      [{ text: 'OK' }],
    )
  }, [])

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        header: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          gap: spacing.sm,
        },
        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor: c.inputBorder,
          borderRadius: 12,
          paddingHorizontal: spacing.sm,
          height: 44,
        },
        searchInput: {
          flex: 1,
          color: c.text,
          fontSize: 15,
          marginLeft: spacing.xs,
          paddingVertical: 0,
        },
        clearBtn: {
          padding: 4,
        },
        countRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xs,
        },
        countText: {
          fontSize: 13,
          color: c.textSecondary,
          fontWeight: '500',
        },
        chipScroll: {
          paddingHorizontal: spacing.md,
          gap: spacing.xs,
        },
        chip: {
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 20,
          borderWidth: 1,
          marginRight: spacing.xs,
        },
        chipText: {
          fontSize: 13,
          fontWeight: '600',
        },
        list: {
          padding: spacing.md,
          paddingTop: spacing.xs,
        },
        card: {
          backgroundColor: c.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.cardBorder,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        cardTopRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        studentName: {
          fontSize: 16,
          fontWeight: '700',
          color: c.text,
          flex: 1,
          marginRight: spacing.sm,
        },
        statusBadge: {
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 10,
        },
        statusText: {
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        regNumber: {
          fontSize: 13,
          color: c.primary,
          fontWeight: '600',
          marginTop: 4,
        },
        detailRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.sm,
          gap: spacing.sm,
        },
        detailChip: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.cardAlt,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          gap: 4,
        },
        detailText: {
          fontSize: 12,
          color: c.textSecondary,
          fontWeight: '500',
        },
        deptCode: {
          fontSize: 12,
          color: c.primaryLight,
          fontWeight: '700',
        },
      }),
    [c, spacing],
  )

  if (isLoading) return <LoadingScreen />

  return (
    <View style={styles.container}>
      {/* Search + Filters */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <Search size={18} color={c.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or register number..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch('')}>
              <X size={16} color={c.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Department Filter Chips */}
        {departments && departments.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: selectedDept === null ? c.primary : 'transparent',
                  borderColor: selectedDept === null ? c.primary : c.border,
                },
              ]}
              onPress={() => setSelectedDept(null)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selectedDept === null ? c.buttonText : c.textSecondary },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {departments.map((dept: Department) => (
              <TouchableOpacity
                key={dept.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedDept === dept.id ? c.primary : 'transparent',
                    borderColor: selectedDept === dept.id ? c.primary : c.border,
                  },
                ]}
                onPress={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedDept === dept.id ? c.buttonText : c.textSecondary },
                  ]}
                >
                  {dept.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Total Count */}
      <View style={styles.countRow}>
        <Users size={14} color={c.textSecondary} />
        <Text style={styles.countText}>
          {total} student{total !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Student List */}
      <Animated.View entering={FadeInDown.duration(400).springify().damping(18).stiffness(180)} style={{ flex: 1 }}>
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🎓"
              title="No students found"
              message={search ? 'Try a different search term' : 'No students match the selected filters'}
            />
          }
          renderItem={({ item, index }) => {
            const statusStyle = getStatusStyle(item.status)
            return (
              <Animated.View entering={FadeInDown.duration(300).delay(index * 40).springify().damping(20).stiffness(200)}>
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => showStudentDetail(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.regNumber}>{item.registerNumber}</Text>

                  <View style={styles.detailRow}>
                    <View style={styles.detailChip}>
                      <GraduationCap size={12} color={c.primaryLight} />
                      <Text style={styles.deptCode}>{item.department.code}</Text>
                    </View>
                    <View style={styles.detailChip}>
                      <Text style={styles.detailText}>
                        Y{item.year} S{item.semester}
                      </Text>
                    </View>
                    <View style={styles.detailChip}>
                      <Text style={styles.detailText}>Sec {item.section}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )
          }}
        />
      </Animated.View>
    </View>
  )
}
