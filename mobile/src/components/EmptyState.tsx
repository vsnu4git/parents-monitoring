import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../hooks/useTheme'

interface EmptyStateProps {
  icon?: string
  title: string
  message?: string
}

export function EmptyState({ icon = '📭', title, message }: EmptyStateProps) {
  const { c, spacing } = useTheme()

  const dynamicStyles = useMemo(
    () => ({
      container: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        padding: spacing.xxl,
      },
      title: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: c.text,
        textAlign: 'center' as const,
      },
      message: {
        fontSize: 14,
        color: c.textMuted,
        textAlign: 'center' as const,
        marginTop: spacing.xs,
      },
    }),
    [c, spacing]
  )

  return (
    <View style={dynamicStyles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={dynamicStyles.title}>{title}</Text>
      {message && <Text style={dynamicStyles.message}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  icon: { fontSize: 48, marginBottom: 16 },
})
