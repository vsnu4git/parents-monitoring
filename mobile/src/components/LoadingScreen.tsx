import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  cancelAnimation,
} from 'react-native-reanimated'
import { useTheme } from '../hooks/useTheme'

// ── Individual animated dot ──
function LoadingDot({ color, delay }: { color: string; delay: number }) {
  const translateY = useSharedValue(0)
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.bezierFn(0.34, 1.56, 0.64, 1) }),
        ),
        -1,
        false,
      ),
    )
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    )
    return () => {
      cancelAnimation(translateY)
      cancelAnimation(opacity)
    }
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        style,
      ]}
    />
  )
}

export function LoadingScreen() {
  const { c } = useTheme()
  const scale = useSharedValue(1)
  const logoOpacity = useSharedValue(0.5)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
    logoOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
    return () => {
      cancelAnimation(scale)
      cancelAnimation(logoOpacity)
    }
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: logoOpacity.value,
  }))

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <Animated.View style={pulseStyle}>
          <Text style={[styles.logo, { color: c.primary }]}>PMS</Text>
        </Animated.View>
        <View style={styles.dotsRow}>
          <LoadingDot color={c.primary} delay={0} />
          <LoadingDot color={c.primary} delay={120} />
          <LoadingDot color={c.primary} delay={240} />
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  logo: { fontSize: 48, fontWeight: '900', letterSpacing: 8, textAlign: 'center' },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    height: 20,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
