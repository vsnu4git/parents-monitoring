import React from 'react'
import Animated, { FadeInDown, FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated'

type Direction = 'down' | 'up' | 'left' | 'right'

/**
 * Shared animated card wrapper — uses Reanimated (UI thread) for 60fps.
 * Professional spring physics with configurable direction.
 */
export function AnimatedCard({
  children,
  style,
  delay = 0,
  direction = 'down',
}: {
  children: React.ReactNode
  style?: any
  delay?: number
  direction?: Direction
}) {
  const EnterMap = {
    down: FadeInDown,
    up: FadeInUp,
    left: FadeInLeft,
    right: FadeInRight,
  }
  const Enter = EnterMap[direction]

  return (
    <Animated.View
      entering={Enter.duration(400).delay(delay).springify().damping(18).stiffness(200)}
      style={style}
    >
      {children}
    </Animated.View>
  )
}
