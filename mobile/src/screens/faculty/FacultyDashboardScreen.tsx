import React, { useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  BookOpen,
  ClipboardList,
  CheckCircle,
  Circle,
  GraduationCap,
  Hash,
  Layers,
} from 'lucide-react-native'
import { getFacultyDashboard } from '../../api/endpoints'
import { useAuth } from '../../auth/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { LoadingScreen } from '../../components/LoadingScreen'

// ─── Stat Card ────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  colors,
  index,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  colors: any
  index: number
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 80).springify()}
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: colors.inputBg }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Animated.View>
  )
}

// ─── Subject Card ─────────────────────────────────────────
function SubjectCard({
  subject,
  markedToday,
  colors,
  index,
}: {
  subject: {
    id: string
    code: string
    name: string
    semester: number
    credits: number
    department: { id: string; name: string }
    studentCount: number
  }
  markedToday: boolean
  colors: any
  index: number
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(400 + index * 60).springify()}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.subjectCard,
          {
            backgroundColor: colors.surface,
            borderColor: markedToday ? colors.successBorder : colors.cardBorder,
          },
        ]}
      >
        {/* Header row */}
        <View style={styles.subjectHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subjectCode, { color: colors.primary }]}>
              {subject.code}
            </Text>
            <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={2}>
              {subject.name}
            </Text>
          </View>
          {markedToday ? (
            <View style={[styles.markedBadge, { backgroundColor: colors.successLight }]}>
              <CheckCircle size={14} color={colors.success} />
              <Text style={[styles.markedText, { color: colors.success }]}>Marked</Text>
            </View>
          ) : (
            <View style={[styles.markedBadge, { backgroundColor: colors.warningLight }]}>
              <Circle size={14} color={colors.warning} />
              <Text style={[styles.markedText, { color: colors.warning }]}>Pending</Text>
            </View>
          )}
        </View>

        {/* Info chips */}
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: colors.inputBg }]}>
            <Layers size={12} color={colors.textSecondary} />
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>
              Sem {subject.semester}
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.inputBg }]}>
            <Hash size={12} color={colors.textSecondary} />
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>
              {subject.credits} Credits
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.inputBg }]}>
            <Users size={12} color={colors.textSecondary} />
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>
              {subject.studentCount} Students
            </Text>
          </View>
        </View>

        {/* Department */}
        <Text style={[styles.subjectDept, { color: colors.textTertiary }]}>
          {subject.department.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────
export function FacultyDashboardScreen() {
  const { c } = useTheme()
  const { user } = useAuth()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['faculty-dashboard'],
    queryFn: getFacultyDashboard,
  })

  const onRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  if (isLoading) return <LoadingScreen />

  const faculty = data?.faculty
  const subjects = data?.subjects ?? []
  const todaysClassesMarked = data?.todaysClassesMarked ?? []
  const pendingLeaves = data?.pendingLeaves ?? 0
  const totalStudents = data?.totalStudents ?? 0

  const firstName = faculty?.user?.name?.split(' ')[0] ?? user?.name?.split(' ')[0] ?? 'Faculty'

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {/* ── Welcome Header ── */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.headerSection}
        >
          <Text style={[styles.greeting, { color: c.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: c.text }]}>Hello, {firstName}</Text>
          {faculty && (
            <View style={styles.headerMeta}>
              <Text style={[styles.headerMetaText, { color: c.primary }]}>
                {faculty.designation}
              </Text>
              <Text style={[styles.headerDot, { color: c.textTertiary }]}> &middot; </Text>
              <Text style={[styles.headerMetaText, { color: c.textSecondary }]}>
                {faculty.department}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon={<Users size={20} color={c.primary} />}
            label="Total Students"
            value={totalStudents}
            colors={c}
            index={0}
          />
          <StatCard
            icon={<BookOpen size={20} color={c.primary} />}
            label="Subjects"
            value={subjects.length}
            colors={c}
            index={1}
          />
          <StatCard
            icon={<ClipboardList size={20} color={c.primary} />}
            label="Pending Leaves"
            value={pendingLeaves}
            colors={c}
            index={2}
          />
        </View>

        {/* ── Today's Classes ── */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Today&apos;s Classes</Text>
          {subjects.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.cardBorder }]}>
              <GraduationCap size={32} color={c.textTertiary} />
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                No classes assigned
              </Text>
            </View>
          ) : (
            <View style={styles.todayList}>
              {subjects.map((subject, idx) => {
                const marked = todaysClassesMarked.includes(subject.id)
                return (
                  <TouchableOpacity
                    key={subject.id}
                    activeOpacity={0.7}
                    style={[
                      styles.todayItem,
                      {
                        backgroundColor: c.surface,
                        borderColor: marked ? c.successBorder : c.cardBorder,
                        borderLeftColor: marked ? c.success : c.primary,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.todaySubjectName, { color: c.text }]}>
                        {subject.name}
                      </Text>
                      <Text style={[styles.todaySubjectCode, { color: c.textSecondary }]}>
                        {subject.code} &middot; Sem {subject.semester}
                      </Text>
                    </View>
                    {marked ? (
                      <CheckCircle size={22} color={c.success} />
                    ) : (
                      <Circle size={22} color={c.textTertiary} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </Animated.View>

        {/* ── All Subjects ── */}
        <Animated.View entering={FadeInDown.delay(450).springify()}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>All Subjects</Text>
        </Animated.View>

        {subjects.map((subject, idx) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            markedToday={todaysClassesMarked.includes(subject.id)}
            colors={c}
            index={idx}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingTop: 16,
  },

  // Header
  headerSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  headerMetaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  headerDot: {
    fontSize: 13,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  // Today's classes
  todayList: {
    gap: 8,
    marginBottom: 28,
  },
  todayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    gap: 12,
  },
  todaySubjectName: {
    fontSize: 15,
    fontWeight: '600',
  },
  todaySubjectCode: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },

  // Empty state
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Subject card
  subjectCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectCode: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  markedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  markedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  subjectDept: {
    fontSize: 11,
    fontWeight: '500',
  },
})
