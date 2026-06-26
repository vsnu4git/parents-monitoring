import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Search, Users, GraduationCap } from 'lucide-react-native'
import { getFacultyDashboard, getFacultyStudents } from '../../api/endpoints'
import { LoadingScreen } from '../../components/LoadingScreen'
import { EmptyState } from '../../components/EmptyState'
import { useTheme } from '../../hooks/useTheme'

export function FacultyStudentsScreen() {
  const { c, spacing, isDark } = useTheme()

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data: dashboard } = useQuery({
    queryKey: ['faculty-dashboard'],
    queryFn: getFacultyDashboard,
  })

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['faculty-students', selectedSubjectId],
    queryFn: () => getFacultyStudents(selectedSubjectId ?? undefined),
  })

  const filteredStudents = useMemo(() => {
    const students = data?.students ?? []
    if (!search.trim()) return students
    const q = search.trim().toLowerCase()
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.registerNumber.toLowerCase().includes(q),
    )
  }, [data, search])

  const subjects = dashboard?.subjects ?? []

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        header: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: c.border,
          paddingHorizontal: spacing.sm,
          gap: 8,
        },
        searchInput: {
          flex: 1,
          fontSize: 14,
          color: c.text,
          paddingVertical: 10,
        },
        chipsScroll: { marginTop: spacing.sm },
        chipsContent: {
          paddingHorizontal: spacing.md,
          gap: 8,
          flexDirection: 'row',
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
          backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.1)',
          borderColor: c.primary,
        },
        chipText: {
          fontSize: 13,
          fontWeight: '500',
          color: c.textSecondary,
        },
        chipTextActive: {
          color: c.primary,
          fontWeight: '600',
        },
        countBar: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: 4,
        },
        countText: {
          fontSize: 13,
          fontWeight: '600',
          color: c.textSecondary,
        },
        list: { padding: spacing.md, gap: spacing.sm },
        card: {
          backgroundColor: c.surface,
          borderRadius: 12,
          padding: spacing.md,
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        studentName: { fontSize: 16, fontWeight: '700', color: c.text },
        registerNo: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        deptBadge: {
          backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.1)',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          alignSelf: 'flex-start',
        },
        deptText: { fontSize: 11, fontWeight: '600', color: c.primary },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: c.border,
          marginVertical: spacing.sm,
        },
        detailRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        detailItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        detailLabel: { fontSize: 12, color: c.textSecondary },
        detailValue: { fontSize: 13, color: c.text, fontWeight: '500' },
      }),
    [c, spacing, isDark],
  )

  if (isLoading) return <LoadingScreen />

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={18} color={c.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or register number"
            placeholderTextColor={c.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Subject filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedSubjectId && styles.chipActive]}
          onPress={() => setSelectedSubjectId(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, !selectedSubjectId && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {subjects.map((subj) => (
          <TouchableOpacity
            key={subj.id}
            style={[styles.chip, selectedSubjectId === subj.id && styles.chipActive]}
            onPress={() => setSelectedSubjectId(subj.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedSubjectId === subj.id && styles.chipTextActive,
              ]}
            >
              {subj.code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Total count */}
      <View style={styles.countBar}>
        <Users size={14} color={c.textSecondary} />
        <Text style={styles.countText}>
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Student list */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title="No students found"
            message={search ? 'Try a different search term' : 'No students for this subject'}
          />
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(400)
              .delay(index * 50)
              .springify()
              .damping(18)
              .stiffness(180)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.registerNo}>{item.registerNumber}</Text>
              </View>
              <View style={styles.deptBadge}>
                <Text style={styles.deptText}>{item.department.code}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <GraduationCap size={14} color={c.textSecondary} />
                <Text style={styles.detailLabel}>Year</Text>
                <Text style={styles.detailValue}>{item.year}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sem</Text>
                <Text style={styles.detailValue}>{item.semester}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Section</Text>
                <Text style={styles.detailValue}>{item.section}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      />
    </View>
  )
}
