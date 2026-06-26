import React, { useMemo } from 'react'
import { Text, Platform, Pressable, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated'
import { useTheme } from '../hooks/useTheme'

interface CardProps {
  title?: string
  children: React.ReactNode
  onPress?: () => void
  style?: ViewStyle | ViewStyle[]
  delay?: number
  index?: number
}

const SPRING_CONFIG = { damping: 18, stiffness: 180 }

export function Card({ title, children, onPress, style, delay = 0, index = 0 }: CardProps) {
  const { c, spacing } = useTheme()
  const scale = useSharedValue(1)

  const staggerDelay = delay || index * 60
  const enteringAnim = FadeInDown.delay(staggerDelay).duration(400)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.98, SPRING_CONFIG)
  }

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, SPRING_CONFIG)
  }

  const dynamicStyles = useMemo(() => {
    const shadow = Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
      default: {},
    })

    return {
      card: {
        backgroundColor: c.surface,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: c.cardBorder ?? c.border,
        ...shadow,
      } as ViewStyle,
      title: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: c.textTertiary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
      },
    }
  }, [c, spacing])

  return (
    <Animated.View entering={enteringAnim} style={[dynamicStyles.card, animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
      >
        {title && <Text style={dynamicStyles.title}>{title}</Text>}
        {children}
      </Pressable>
    </Animated.View>
  )
}
