import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFacultyDashboard, getFacultyMarks, enterFacultyMarks } from '../../api/endpoints'
import { LoadingScreen } from '../../components/LoadingScreen'
import { useTheme } from '../../hooks/useTheme'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { BookOpen, Save, CheckCircle, AlertTriangle } from 'lucide-react-native'

// ── Constants ──────────────────────────────────────────────
const ASSESSMENT_TYPES = [
  'INTERNAL_1',
  'INTERNAL_2',
  'INTERNAL_3',
  'MODEL_EXAM',
  'SEMESTER_EXAM',
  'ASSIGNMENT',
  'QUIZ',
  'LAB',
] as const

const TYPE_LABELS: Record<string, string> = {
  INTERNAL_1: 'Internal 1',
  INTERNAL_2: 'Internal 2',
  INTERNAL_3: 'Internal 3',
  MODEL_EXAM: 'Model Exam',
  SEMESTER_EXAM: 'Semester',
  ASSIGNMENT: 'Assignment',
  QUIZ: 'Quiz',
  LAB: 'Lab',
}

type AssessmentType = (typeof ASSESSMENT_TYPES)[number]

// ── Component ──────────────────────────────────────────────
export function FacultyMarksScreen() {
  const { c, isDark } = useTheme()
  const queryClient = useQueryClient()

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType>('INTERNAL_1')
  const [maxScore, setMaxScore] = useState('100')
  const [scores, setScores] = useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})

  // ── Queries ────────────────────────────────────────────
  const dashboardQuery = useQuery({
    queryKey: ['faculty', 'dashboard'],
    queryFn: getFacultyDashboard,
  })

  const subjects = dashboardQuery.data?.subjects ?? []

  // Auto-select first subject
  const subjectId = selectedSubjectId ?? subjects[0]?.id ?? null

  const marksQuery = useQuery({
    queryKey: ['faculty', 'marks', subjectId, selectedAssessment],
    queryFn: () => getFacultyMarks(subjectId!, selectedAssessment),
    enabled: !!subjectId,
  })

  // Pre-fill scores when marks data loads
  React.useEffect(() => {
    if (marksQuery.data?.marks) {
      const prefilled: Record<string, string> = {}
      for (const student of marksQuery.data.marks) {
        if (student.marks !== null) {
          prefilled[student.studentId] = String(student.marks.score)
        }
      }
      setScores(prefilled)
      setValidationErrors({})
      // If existing marks have a maxScore, use it
      const firstWithMarks = marksQuery.data.marks.find((s) => s.marks !== null)
      if (firstWithMarks?.marks) {
        setMaxScore(String(firstWithMarks.marks.maxScore))
      }
    }
  }, [marksQuery.data])

  // ── Mutation ───────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: enterFacultyMarks,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['faculty', 'marks', subjectId, selectedAssessment] })
      Alert.alert('Success', `Marks saved for ${data.saved} students.`)
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message || 'Failed to save marks.')
    },
  })

  // ── Handlers ───────────────────────────────────────────
  const handleScoreChange = (studentId: string, value: string) => {
    setScores((prev) => ({ ...prev, [studentId]: value }))
    // Clear validation error when user edits
    if (validationErrors[studentId]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[studentId]
        return next
      })
    }
  }

  const handleSave = () => {
    const max = parseFloat(maxScore)
    if (isNaN(max) || max <= 0) {
      Alert.alert('Invalid Max Score', 'Please enter a valid max score greater than 0.')
      return
    }

    const students = marksQuery.data?.marks ?? []
    const errors: Record<string, boolean> = {}
    const records: { studentId: string; score: number; remarks?: string }[] = []

    for (const student of students) {
      const raw = scores[student.studentId]
      if (raw === undefined || raw.trim() === '') continue

      const score = parseFloat(raw)
      if (isNaN(score) || score < 0 || score > max) {
        errors[student.studentId] = true
      } else {
        records.push({ studentId: student.studentId, score })
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      Alert.alert('Validation Error', `Some scores exceed the max score (${max}) or are invalid. Please fix the highlighted entries.`)
      return
    }

    if (records.length === 0) {
      Alert.alert('No Data', 'Please enter at least one score before saving.')
      return
    }

    saveMutation.mutate({
      subjectId: subjectId!,
      assessmentType: selectedAssessment,
      maxScore: max,
      records,
    })
  }

  const handleRefresh = () => {
    dashboardQuery.refetch()
    if (subjectId) marksQuery.refetch()
  }

  // ── Styles ─────────────────────────────────────────────
  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: c.background,
        },
        scroll: {
          padding: 16,
          paddingBottom: 100,
        },
        header: {
          marginBottom: 20,
        },
        title: {
          fontSize: 24,
          fontWeight: '700',
          color: c.text,
          marginBottom: 4,
        },
        subtitle: {
          fontSize: 14,
          color: c.textSecondary,
        },
        sectionLabel: {
          fontSize: 13,
          fontWeight: '600',
          color: c.textSecondary,
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        chipRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
        },
        chip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        },
        chipActive: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)',
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
        maxScoreRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
          gap: 12,
        },
        maxScoreLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: c.text,
        },
        maxScoreInput: {
          width: 80,
          height: 40,
          borderRadius: 10,
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor: c.inputBorder,
          color: c.text,
          fontSize: 16,
          fontWeight: '600',
          textAlign: 'center',
          paddingHorizontal: 8,
        },
        card: {
          backgroundColor: c.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.cardBorder,
          padding: 16,
          marginBottom: 20,
        },
        studentRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: c.borderLight,
        },
        studentRowLast: {
          borderBottomWidth: 0,
        },
        studentInfo: {
          flex: 1,
        },
        studentName: {
          fontSize: 14,
          fontWeight: '600',
          color: c.text,
        },
        studentRegNo: {
          fontSize: 12,
          color: c.textSecondary,
          marginTop: 2,
        },
        studentSection: {
          fontSize: 11,
          color: c.textTertiary,
          marginTop: 1,
        },
        scoreInput: {
          width: 70,
          height: 38,
          borderRadius: 10,
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor: c.inputBorder,
          color: c.text,
          fontSize: 15,
          fontWeight: '600',
          textAlign: 'center',
          paddingHorizontal: 6,
        },
        scoreInputError: {
          borderColor: c.error,
          backgroundColor: c.errorLight,
        },
        saveButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.primary,
          paddingVertical: 14,
          borderRadius: 14,
          marginTop: 8,
          gap: 8,
        },
        saveButtonDisabled: {
          opacity: 0.5,
        },
        saveButtonText: {
          fontSize: 16,
          fontWeight: '700',
          color: '#0A0A0A',
        },
        emptyContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 60,
        },
        emptyText: {
          fontSize: 15,
          color: c.textSecondary,
          marginTop: 12,
        },
        studentCount: {
          fontSize: 12,
          color: c.textTertiary,
          marginBottom: 12,
        },
      }),
    [c, isDark],
  )

  // ── Loading State ──────────────────────────────────────
  if (dashboardQuery.isLoading) return <LoadingScreen />

  // ── Render ─────────────────────────────────────────────
  const students = marksQuery.data?.marks ?? []
  const isRefreshing = dashboardQuery.isRefetching || marksQuery.isRefetching

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={c.primary} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
          <Text style={s.title}>Enter Marks</Text>
          <Text style={s.subtitle}>Select subject and assessment type</Text>
        </Animated.View>

        {/* Subject Picker */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={s.sectionLabel}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={s.chipRow}>
              {subjects.map((sub) => {
                const active = sub.id === subjectId
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => {
                      setSelectedSubjectId(sub.id)
                      setScores({})
                      setValidationErrors({})
                    }}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {sub.code} - {sub.name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Assessment Type Picker */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={s.sectionLabel}>Assessment Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={s.chipRow}>
              {ASSESSMENT_TYPES.map((type) => {
                const active = type === selectedAssessment
                return (
                  <TouchableOpacity
                    key={type}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => {
                      setSelectedAssessment(type)
                      setScores({})
                      setValidationErrors({})
                    }}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{TYPE_LABELS[type]}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Max Score Input */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={s.maxScoreRow}>
          <Text style={s.maxScoreLabel}>Max Score</Text>
          <TextInput
            style={s.maxScoreInput}
            value={maxScore}
            onChangeText={setMaxScore}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor={c.textMuted}
          />
        </Animated.View>

        {/* Student List */}
        {!subjectId ? (
          <View style={s.emptyContainer}>
            <BookOpen size={40} color={c.textMuted} />
            <Text style={s.emptyText}>Select a subject to begin</Text>
          </View>
        ) : marksQuery.isLoading ? (
          <LoadingScreen />
        ) : students.length === 0 ? (
          <View style={s.emptyContainer}>
            <AlertTriangle size={40} color={c.textMuted} />
            <Text style={s.emptyText}>No students found for this subject</Text>
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Text style={s.studentCount}>
              {students.length} student{students.length !== 1 ? 's' : ''}
            </Text>
            <View style={s.card}>
              {students.map((student, idx) => {
                const hasError = validationErrors[student.studentId]
                const isLast = idx === students.length - 1
                return (
                  <View key={student.studentId} style={[s.studentRow, isLast && s.studentRowLast]}>
                    <View style={s.studentInfo}>
                      <Text style={s.studentName}>{student.name}</Text>
                      <Text style={s.studentRegNo}>{student.registerNumber}</Text>
                      <Text style={s.studentSection}>Section {student.section}</Text>
                    </View>
                    <TextInput
                      style={[s.scoreInput, hasError && s.scoreInputError]}
                      value={scores[student.studentId] ?? ''}
                      onChangeText={(v) => handleScoreChange(student.studentId, v)}
                      keyboardType="numeric"
                      placeholder="--"
                      placeholderTextColor={c.textMuted}
                    />
                  </View>
                )
              })}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[s.saveButton, saveMutation.isPending && s.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saveMutation.isPending}
              activeOpacity={0.7}
            >
              {saveMutation.isPending ? (
                <Text style={s.saveButtonText}>Saving...</Text>
              ) : (
                <>
                  <Save size={18} color="#0A0A0A" />
                  <Text style={s.saveButtonText}>Save Marks</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
