import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFacultyDashboard,
  getFacultyAttendance,
  markFacultyAttendance,
} from '../../api/endpoints'
import { LoadingScreen } from '../../components/LoadingScreen'
import { useTheme } from '../../hooks/useTheme'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Users,
  Save,
  CheckCheck,
} from 'lucide-react-native'
import type { AttendanceStudentRecord } from '../../types/api'

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type LocalRecord = AttendanceStudentRecord & { localStatus: string | null }

export function FacultyAttendanceScreen() {
  const { c, spacing, isDark } = useTheme()
  const queryClient = useQueryClient()

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [date, setDate] = useState(() => new Date())
  const [localRecords, setLocalRecords] = useState<LocalRecord[]>([])
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set())

  const dateStr = formatDate(date)

  // ── Queries ──────────────────────────────────────────────────
  const {
    data: dashboard,
    isLoading: dashLoading,
  } = useQuery({
    queryKey: ['faculty-dashboard'],
    queryFn: getFacultyDashboard,
  })

  const subjects = dashboard?.subjects ?? []

  // Auto-select first subject
  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id)
    }
  }, [subjects, selectedSubjectId])

  const {
    data: attendanceData,
    isLoading: attLoading,
    refetch,
  } = useQuery({
    queryKey: ['faculty-attendance', selectedSubjectId, dateStr],
    queryFn: () => getFacultyAttendance(selectedSubjectId!, dateStr),
    enabled: !!selectedSubjectId,
  })

  // Sync API data into local state
  useEffect(() => {
    if (attendanceData?.attendance) {
      setLocalRecords(
        attendanceData.attendance.map((r) => ({ ...r, localStatus: r.status }))
      )
      setChangedIds(new Set())
    }
  }, [attendanceData])

  // ── Mutation ─────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: markFacultyAttendance,
    onSuccess: (res) => {
      Alert.alert('Success', `Attendance saved for ${res.saved} student(s).`)
      setChangedIds(new Set())
      queryClient.invalidateQueries({ queryKey: ['faculty-attendance', selectedSubjectId, dateStr] })
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  })

  // ── Handlers ─────────────────────────────────────────────────
  const toggleStatus = useCallback((studentId: string) => {
    setLocalRecords((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r
        const next = r.localStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT'
        return { ...r, localStatus: next }
      })
    )
    setChangedIds((prev) => new Set(prev).add(studentId))
  }, [])

  const markAllPresent = useCallback(() => {
    setLocalRecords((prev) =>
      prev.map((r) => ({ ...r, localStatus: 'PRESENT' }))
    )
    setChangedIds(new Set(localRecords.map((r) => r.studentId)))
  }, [localRecords])

  const handleSave = useCallback(() => {
    if (!selectedSubjectId) return
    const records = localRecords
      .filter((r) => changedIds.has(r.studentId) && r.localStatus)
      .map((r) => ({ studentId: r.studentId, status: r.localStatus! }))
    if (records.length === 0) {
      Alert.alert('No Changes', 'No attendance changes to save.')
      return
    }
    mutation.mutate({ subjectId: selectedSubjectId, date: dateStr, records })
  }, [selectedSubjectId, dateStr, localRecords, changedIds, mutation])

  const shiftDate = useCallback((days: number) => {
    setDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + days)
      return d
    })
  }, [])

  // ── Styles ───────────────────────────────────────────────────
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        content: { padding: spacing.md },
        sectionTitle: {
          fontSize: 13,
          fontWeight: '600',
          color: c.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: spacing.sm,
          marginTop: spacing.md,
        },
        chipRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        chip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        },
        chipActive: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)',
          borderColor: c.primary,
        },
        chipText: { fontSize: 13, color: c.textSecondary },
        chipTextActive: { color: c.primary, fontWeight: '600' },
        dateRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: c.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: c.border,
          padding: spacing.sm,
          marginTop: spacing.md,
        },
        dateBtn: {
          padding: spacing.sm,
          borderRadius: 8,
        },
        dateText: {
          fontSize: 15,
          fontWeight: '600',
          color: c.text,
        },
        actionRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        },
        markAllBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: isDark ? 'rgba(76,175,80,0.12)' : 'rgba(76,175,80,0.1)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(76,175,80,0.3)' : 'rgba(76,175,80,0.25)',
        },
        markAllText: {
          fontSize: 13,
          fontWeight: '600',
          color: c.success,
        },
        countText: {
          fontSize: 13,
          color: c.textSecondary,
        },
        studentCard: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: c.surface,
          borderRadius: 12,
          borderWidth: 1.5,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        studentInfo: { flex: 1 },
        studentName: { fontSize: 15, fontWeight: '600', color: c.text },
        studentMeta: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        statusBadge: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 8,
          minWidth: 80,
          alignItems: 'center',
        },
        statusText: { fontSize: 13, fontWeight: '700' },
        saveBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: c.primary,
          paddingVertical: 14,
          borderRadius: 12,
          marginTop: spacing.md,
          marginBottom: spacing.xl,
        },
        saveBtnDisabled: { opacity: 0.5 },
        saveBtnText: {
          fontSize: 16,
          fontWeight: '700',
          color: c.buttonText,
        },
        emptyText: {
          textAlign: 'center',
          color: c.textSecondary,
          fontSize: 14,
          marginTop: spacing.xl,
        },
      }),
    [c, spacing, isDark]
  )

  // ── Status colors ────────────────────────────────────────────
  const getStatusStyle = useCallback(
    (status: string | null) => {
      if (status === 'PRESENT') {
        return {
          cardBorder: isDark ? 'rgba(76,175,80,0.3)' : 'rgba(76,175,80,0.25)',
          badgeBg: isDark ? 'rgba(76,175,80,0.15)' : 'rgba(76,175,80,0.1)',
          badgeText: c.success,
        }
      }
      if (status === 'ABSENT') {
        return {
          cardBorder: isDark ? 'rgba(229,57,53,0.3)' : 'rgba(229,57,53,0.25)',
          badgeBg: isDark ? 'rgba(229,57,53,0.15)' : 'rgba(229,57,53,0.1)',
          badgeText: c.error,
        }
      }
      return {
        cardBorder: c.border,
        badgeBg: c.surface,
        badgeText: c.textSecondary,
      }
    },
    [c, isDark]
  )

  // ── Loading ──────────────────────────────────────────────────
  if (dashLoading) return <LoadingScreen />

  const presentCount = localRecords.filter((r) => r.localStatus === 'PRESENT').length
  const absentCount = localRecords.filter((r) => r.localStatus === 'ABSENT').length
  const totalCount = localRecords.length

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {/* Subject Picker */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <Text style={styles.sectionTitle}>Subject</Text>
          <View style={styles.chipRow}>
            {subjects.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.chip,
                  selectedSubjectId === sub.id && styles.chipActive,
                ]}
                onPress={() => setSelectedSubjectId(sub.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedSubjectId === sub.id && styles.chipTextActive,
                  ]}
                >
                  {sub.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Date Picker */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => shiftDate(-1)}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={c.text} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => shiftDate(1)}
              activeOpacity={0.7}
            >
              <ChevronRight size={20} color={c.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Action Row */}
        {selectedSubjectId && !attLoading && localRecords.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).duration(400)}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.markAllBtn}
                onPress={markAllPresent}
                activeOpacity={0.7}
              >
                <CheckCheck size={16} color={c.success} />
                <Text style={styles.markAllText}>Mark All Present</Text>
              </TouchableOpacity>
              <Text style={styles.countText}>
                <Text style={{ color: c.success, fontWeight: '700' }}>{presentCount}</Text>
                {' / '}
                <Text style={{ color: c.error, fontWeight: '700' }}>{absentCount}</Text>
                {' / '}
                {totalCount}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Loading */}
        {attLoading && selectedSubjectId && (
          <Text style={styles.emptyText}>Loading attendance...</Text>
        )}

        {/* Empty */}
        {!attLoading && selectedSubjectId && localRecords.length === 0 && (
          <Text style={styles.emptyText}>No students found for this subject.</Text>
        )}

        {/* Student List */}
        {localRecords.map((record, index) => {
          const ss = getStatusStyle(record.localStatus)
          return (
            <Animated.View
              key={record.studentId}
              entering={FadeInDown.delay(200 + index * 40).duration(400)}
            >
              <TouchableOpacity
                style={[styles.studentCard, { borderColor: ss.cardBorder }]}
                onPress={() => toggleStatus(record.studentId)}
                activeOpacity={0.7}
              >
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{record.name}</Text>
                  <Text style={styles.studentMeta}>
                    {record.registerNumber}  {record.section}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: ss.badgeBg }]}>
                  {record.localStatus === 'PRESENT' ? (
                    <CheckCircle2 size={18} color={ss.badgeText} />
                  ) : record.localStatus === 'ABSENT' ? (
                    <XCircle size={18} color={ss.badgeText} />
                  ) : (
                    <Users size={18} color={ss.badgeText} />
                  )}
                  <Text style={[styles.statusText, { color: ss.badgeText, marginTop: 2 }]}>
                    {record.localStatus ?? 'NOT SET'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )
        })}

        {/* Save Button */}
        {localRecords.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (mutation.isPending || changedIds.size === 0) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={mutation.isPending || changedIds.size === 0}
              activeOpacity={0.8}
            >
              <Save size={18} color={c.buttonText} />
              <Text style={styles.saveBtnText}>
                {mutation.isPending ? 'Saving...' : `Save Attendance (${changedIds.size} changed)`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  )
}
