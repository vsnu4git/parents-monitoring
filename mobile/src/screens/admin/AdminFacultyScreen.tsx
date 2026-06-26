import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronDown, ChevronUp, BookOpen, User } from 'lucide-react-native'
import { getAdminFaculty } from '../../api/endpoints'
import { Card } from '../../components/Card'
import { LoadingScreen } from '../../components/LoadingScreen'
import { EmptyState } from '../../components/EmptyState'
import { useTheme } from '../../hooks/useTheme'
import type { AdminFacultyEntry } from '../../types/api'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export function AdminFacultyScreen() {
  const { c, isDark, spacing } = useTheme()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-faculty', search],
    queryFn: () => getAdminFaculty({ search: search || undefined }),
  })

  const faculty = data?.faculty ?? []

  const toggleExpand = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.surface,
          borderRadius: 12,
          marginHorizontal: spacing.md,
          marginTop: spacing.md,
          marginBottom: spacing.sm,
          paddingHorizontal: spacing.sm,
          borderWidth: 1,
          borderColor: c.border,
        },
        searchIcon: { marginRight: spacing.xs },
        searchInput: {
          flex: 1,
          height: 44,
          fontSize: 15,
          color: c.text,
        },
        list: { padding: spacing.md, gap: spacing.sm },
        cardBody: { gap: 6 },
        nameRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        name: { fontSize: 16, fontWeight: '600', color: c.text, flex: 1 },
        badge: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 10,
          marginLeft: 8,
        },
        badgeActive: { backgroundColor: isDark ? '#1A2E1A' : '#E8F5E9' },
        badgeInactive: { backgroundColor: isDark ? '#2E1A1A' : '#FDEAEA' },
        badgeText: { fontSize: 11, fontWeight: '600' },
        badgeTextActive: { color: '#4CAF50' },
        badgeTextInactive: { color: '#E53935' },
        email: { fontSize: 13, color: c.textSecondary },
        detailRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        detailText: { fontSize: 13, color: c.textSecondary },
        subjectsCount: {
          fontSize: 13,
          color: '#FAFAFA',
          fontWeight: '500',
        },
        expandRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: 4,
        },
        expandText: { fontSize: 12, color: c.textTertiary, marginRight: 4 },
        subjectsList: {
          marginTop: spacing.sm,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: c.border,
          gap: 6,
        },
        subjectItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        subjectCode: {
          fontSize: 12,
          fontWeight: '600',
          color: '#FAFAFA',
          backgroundColor: isDark ? '#1A1508' : '#FFF8E1',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          overflow: 'hidden',
        },
        subjectName: { fontSize: 13, color: c.text, flex: 1 },
      }),
    [c, isDark, spacing],
  )

  const renderItem = useCallback(
    ({ item, index }: { item: AdminFacultyEntry; index: number }) => {
      const isExpanded = expandedId === item.id
      const isActive = item.user.isActive
      const subjectCount = item.subjects.length

      return (
        <Card index={index} onPress={() => toggleExpand(item.id)} style={{ marginBottom: 0 }}>
          <View style={styles.cardBody}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.user.name}
              </Text>
              <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text
                  style={[
                    styles.badgeText,
                    isActive ? styles.badgeTextActive : styles.badgeTextInactive,
                  ]}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <Text style={styles.email}>{item.user.email}</Text>

            <View style={styles.detailRow}>
              <User size={14} color={c.textSecondary} />
              <Text style={styles.detailText}>
                {item.department}
                {item.designation ? ` \u00B7 ${item.designation}` : ''}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <BookOpen size={14} color="#FAFAFA" />
              <Text style={styles.subjectsCount}>
                {subjectCount} {subjectCount === 1 ? 'subject' : 'subjects'}
              </Text>
            </View>

            {subjectCount > 0 && (
              <View style={styles.expandRow}>
                <Text style={styles.expandText}>
                  {isExpanded ? 'Hide subjects' : 'Show subjects'}
                </Text>
                {isExpanded ? (
                  <ChevronUp size={16} color={c.textTertiary} />
                ) : (
                  <ChevronDown size={16} color={c.textTertiary} />
                )}
              </View>
            )}

            {isExpanded && subjectCount > 0 && (
              <View style={styles.subjectsList}>
                {item.subjects.map((s) => (
                  <View key={s.id} style={styles.subjectItem}>
                    <Text style={styles.subjectCode}>{s.subject.code}</Text>
                    <Text style={styles.subjectName} numberOfLines={1}>
                      {s.subject.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Card>
      )
    },
    [expandedId, toggleExpand, styles, c],
  )

  if (isLoading) return <LoadingScreen />

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color={c.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search faculty..."
          placeholderTextColor={c.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Animated.View
        entering={FadeInDown.duration(400).springify().damping(18).stiffness(180)}
        style={{ flex: 1 }}
      >
        <FlatList
          data={faculty}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title="No faculty found"
              message={search ? 'Try a different search term' : 'No faculty members yet'}
            />
          }
          renderItem={renderItem}
        />
      </Animated.View>
    </View>
  )
}
