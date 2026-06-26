import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import type { Student } from '../types/api'

interface StudentSelectorProps {
  students: Student[]
  selectedId: string
  onSelect: (id: string) => void
}

export function StudentSelector({ students, selectedId, onSelect }: StudentSelectorProps) {
  const { c, spacing } = useTheme()

  const dynamicStyles = useMemo(
    () => ({
      container: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        paddingVertical: spacing.sm,
      },
      chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 12,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
      },
      chipActive: {
        backgroundColor: c.primary,
        borderColor: c.primary,
      },
      name: { fontSize: 14, fontWeight: '600' as const, color: c.text },
      nameActive: { color: c.buttonText },
      info: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
      infoActive: { color: c.buttonText, opacity: 0.7 },
    }),
    [c, spacing]
  )

  if (students.length <= 1) return null

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={dynamicStyles.container}
    >
      {students.map((student) => {
        const isActive = student.id === selectedId
        return (
          <TouchableOpacity
            key={student.id}
            style={[dynamicStyles.chip, isActive && dynamicStyles.chipActive]}
            onPress={() => onSelect(student.id)}
          >
            <Text style={[dynamicStyles.name, isActive && dynamicStyles.nameActive]}>
              {student.name}
            </Text>
            <Text style={[dynamicStyles.info, isActive && dynamicStyles.infoActive]}>
              {student.department.code} - Year {student.year}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}
