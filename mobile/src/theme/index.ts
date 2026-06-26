import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper'

// ═══════════════════════════════════════════
// Dark Theme — Black & White
// ═══════════════════════════════════════════
export const darkColors = {
  primary: '#FAFAFA',
  primaryLight: '#E4E4E7',
  primaryDark: '#D4D4D8',
  secondary: '#A1A1AA',
  background: '#09090B',
  surface: '#18181B',
  surfaceVariant: '#111111',
  cardAlt: '#111111',
  error: '#EF4444',
  errorLight: '#1C1111',
  success: '#4ADE80',
  successLight: '#0F1A0F',
  warning: '#FB923C',
  warningLight: '#1A1508',
  info: '#3B82F6',
  infoLight: '#0E1220',
  text: '#FAFAFA',
  textLight: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  textMuted: '#52525B',
  textDim: '#3F3F46',
  textDark: '#27272A',
  textDarkest: '#1E1E1E',
  border: '#27272A',
  borderLight: '#1C1C1C',
  divider: '#1C1C1C',
  dangerBg: '#1C1111',
  dangerBorder: '#3A1515',
  warningBorder: '#3A2A10',
  successBorder: '#153A15',
  // Gradients (for LinearGradient)
  gradientStart: '#0A0A0A',
  gradientMid: '#111111',
  gradientEnd: '#18181B',
  headerGradientStart: '#09090B',
  headerGradientEnd: '#000000',
  // Specific
  cardGlow: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.08)',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.12)',
  toggleOn: '#FAFAFA',
  toggleOff: 'rgba(255,255,255,0.10)',
  toggleKnobOn: '#09090B',
  toggleKnobOff: '#71717A',
  buttonText: '#09090B',
  statusBarStyle: 'light' as const,
}

// ═══════════════════════════════════════════
// Light Theme — White & Black
// ═══════════════════════════════════════════
export const lightColors = {
  primary: '#18181B',
  primaryLight: '#3F3F46',
  primaryDark: '#09090B',
  secondary: '#71717A',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F4F4F5',
  cardAlt: '#FAFAFA',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#EA580C',
  warningLight: '#FFF7ED',
  info: '#2563EB',
  infoLight: '#EFF6FF',
  text: '#09090B',
  textLight: '#000000',
  textSecondary: '#52525B',
  textTertiary: '#71717A',
  textMuted: '#A1A1AA',
  textDim: '#D4D4D8',
  textDark: '#E4E4E7',
  textDarkest: '#F4F4F5',
  border: '#E4E4E7',
  borderLight: '#F4F4F5',
  divider: '#F4F4F5',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  warningBorder: '#FED7AA',
  successBorder: '#BBF7D0',
  gradientStart: '#FFFFFF',
  gradientMid: '#FAFAFA',
  gradientEnd: '#F4F4F5',
  headerGradientStart: '#FFFFFF',
  headerGradientEnd: '#FAFAFA',
  cardGlow: 'rgba(0,0,0,0.03)',
  cardBorder: 'rgba(0,0,0,0.08)',
  inputBg: 'rgba(0,0,0,0.03)',
  inputBorder: 'rgba(0,0,0,0.12)',
  toggleOn: '#18181B',
  toggleOff: 'rgba(0,0,0,0.10)',
  toggleKnobOn: '#FFFFFF',
  toggleKnobOff: '#A1A1AA',
  buttonText: '#FFFFFF',
  statusBarStyle: 'dark' as const,
}

export type ThemeColors = Omit<typeof darkColors, 'statusBarStyle'> & { statusBarStyle: 'light' | 'dark' }

// Default export (for backwards compat) — dark theme
export const colors = darkColors

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const paperThemeDark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    secondary: darkColors.secondary,
    background: darkColors.background,
    surface: darkColors.surface,
    surfaceVariant: darkColors.surfaceVariant,
    error: darkColors.error,
    onPrimary: '#09090B',
    onSecondary: '#FFFFFF',
    onBackground: darkColors.text,
    onSurface: darkColors.text,
    outline: darkColors.border,
  },
}

export const paperThemeLight = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    secondary: lightColors.secondary,
    background: lightColors.background,
    surface: lightColors.surface,
    surfaceVariant: lightColors.surfaceVariant,
    error: lightColors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#09090B',
    onBackground: lightColors.text,
    onSurface: lightColors.text,
    outline: lightColors.border,
  },
}

// Keep paperTheme for backwards compat
export const paperTheme = paperThemeDark

export function getStatusColors(c: ThemeColors): Record<string, { bg: string; text: string }> {
  return {
    PRESENT: { bg: c.successLight, text: c.success },
    ABSENT: { bg: c.errorLight, text: c.error },
    OD: { bg: c.surfaceVariant, text: c.primary },
    LEAVE: { bg: c.warningLight, text: c.warning },
    PAID: { bg: c.successLight, text: c.success },
    PENDING: { bg: c.warningLight, text: c.warning },
    OVERDUE: { bg: c.errorLight, text: c.error },
    PARTIAL: { bg: c.surfaceVariant, text: c.primary },
    WAIVED: { bg: c.surfaceVariant, text: c.textSecondary },
    APPROVED: { bg: c.successLight, text: c.success },
    REJECTED: { bg: c.errorLight, text: c.error },
    CANCELLED: { bg: c.surfaceVariant, text: c.textSecondary },
    OPEN: { bg: c.surfaceVariant, text: c.primary },
    IN_PROGRESS: { bg: c.warningLight, text: c.warning },
    RESOLVED: { bg: c.successLight, text: c.success },
    CLOSED: { bg: c.surfaceVariant, text: c.textSecondary },
    LOW: { bg: c.surfaceVariant, text: c.primary },
    MEDIUM: { bg: c.warningLight, text: c.warning },
    HIGH: { bg: c.warningLight, text: '#EA580C' },
    URGENT: { bg: c.errorLight, text: c.error },
    CRITICAL: { bg: c.errorLight, text: c.error },
    INFO: { bg: c.surfaceVariant, text: c.primary },
    WARNING: { bg: c.warningLight, text: c.warning },
    IN_TRANSIT: { bg: 'rgba(0,0,0,0.08)', text: c.primary },
    ARRIVED: { bg: c.successLight, text: c.success },
    RETURNED: { bg: c.surfaceVariant, text: c.textSecondary },
    MISSED: { bg: c.errorLight, text: c.error },
    ACTIVE: { bg: c.errorLight, text: c.error },
    ACKNOWLEDGED: { bg: c.warningLight, text: c.warning },
    FALSE_ALARM: { bg: c.surfaceVariant, text: c.textTertiary },
  }
}

export const statusColors = getStatusColors(darkColors)
