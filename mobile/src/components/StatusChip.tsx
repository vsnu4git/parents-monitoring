import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../hooks/useTheme'

interface StatusChipProps {
  status: string
  small?: boolean
}

export function StatusChip({ status, small }: StatusChipProps) {
  const { c, sc } = useTheme()

  const colorSet = sc[status] || {
    bg: c.surfaceVariant,
    text: c.textSecondary,
  }

  return (
    <View style={[styles.chip, { backgroundColor: colorSet.bg }, small && styles.chipSmall]}>
      <Text style={[styles.text, { color: colorSet.text }, small && styles.textSmall]}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  chipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 8,
  },
})
