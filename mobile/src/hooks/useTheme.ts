import { useMemo } from 'react'
import { useThemeMode } from '../theme/ThemeContext'
import { darkColors, lightColors, getStatusColors, spacing } from '../theme'

export function useTheme() {
  const { mode, toggle, isDark } = useThemeMode()

  const c = useMemo(() => (isDark ? darkColors : lightColors), [isDark])
  const sc = useMemo(() => getStatusColors(c), [c])

  return { c, sc, spacing, mode, toggle, isDark }
}
