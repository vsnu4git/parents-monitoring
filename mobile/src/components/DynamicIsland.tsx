import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback,
  Platform, UIManager,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  MapPin, ShieldAlert, CheckCircle, AlertTriangle,
  LogIn, LogOut as LogOutIcon, Info, Wifi, CreditCard,
  UtensilsCrossed, Navigation,
} from 'lucide-react-native'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const SCREEN_W = Dimensions.get('window').width
const AUTO_DISMISS_MS = 3800

type NotifType =
  | 'campus_entry' | 'campus_exit' | 'location' | 'sos'
  | 'alert' | 'success' | 'warning' | 'info'
  | 'fee' | 'meal' | 'od_trip' | 'check_in'

interface IslandNotif {
  id: string
  type: NotifType
  title: string
  subtitle?: string
}

const ICON_MAP: Record<NotifType, { Icon: any; color: string }> = {
  campus_entry: { Icon: LogIn, color: '#4CAF50' },
  campus_exit: { Icon: LogOutIcon, color: '#E53935' },
  location: { Icon: MapPin, color: '#FAFAFA' },
  sos: { Icon: ShieldAlert, color: '#E53935' },
  alert: { Icon: AlertTriangle, color: '#FF9800' },
  success: { Icon: CheckCircle, color: '#4CAF50' },
  warning: { Icon: AlertTriangle, color: '#FF9800' },
  info: { Icon: Info, color: '#3B82F6' },
  fee: { Icon: CreditCard, color: '#FAFAFA' },
  meal: { Icon: UtensilsCrossed, color: '#4CAF50' },
  od_trip: { Icon: Navigation, color: '#FAFAFA' },
  check_in: { Icon: Wifi, color: '#4CAF50' },
}

let _pushNotif: ((n: Omit<IslandNotif, 'id'>) => void) | null = null
export function pushIslandNotification(n: Omit<IslandNotif, 'id'>) { _pushNotif?.(n) }

// ── Pulsing glow ring (Reanimated) ──
function GlowRing({ color }: { color: string }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1, false
    )
    return () => cancelAnimation(progress)
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.7, 1.3]) }],
  }))

  return (
    <Animated.View style={[{
      position: 'absolute', width: 44, height: 44, borderRadius: 22,
      borderWidth: 1.5, borderColor: color,
    }, style]} />
  )
}

// ═══════════════════════════════════════════════════════
export function DynamicIslandProvider({ children }: { children: React.ReactNode }) {
  const [notif, setNotif] = useState<IslandNotif | null>(null)
  const [phase, setPhase] = useState<'hidden' | 'pill' | 'expanded' | 'dismissing'>('hidden')

  const translateY = useSharedValue(-60)
  const opacity = useSharedValue(0)
  const scaleX = useSharedValue(0.35)
  const scaleY = useSharedValue(0.5)
  const pillOpacity = useSharedValue(1)
  const contentOpacity = useSharedValue(0)
  const contentTranslateY = useSharedValue(8)
  const bgScale = useSharedValue(1)

  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idCounter = useRef(0)

  useEffect(() => {
    _pushNotif = (n) => {
      idCounter.current++
      setNotif({ ...n, id: `di-${idCounter.current}` })
    }
    return () => { _pushNotif = null }
  }, [])

  const clearTimers = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    if (phaseTimer.current) clearTimeout(phaseTimer.current)
  }

  const dismiss = useCallback(() => {
    clearTimers()
    setPhase('dismissing')

    // Shrink back
    scaleX.value = withSpring(0.35, { damping: 18, stiffness: 200 })
    scaleY.value = withSpring(0.5, { damping: 18, stiffness: 200 })
    contentOpacity.value = withTiming(0, { duration: 120 })

    // Then fly up after shrink
    translateY.value = withDelay(200, withTiming(-60, { duration: 250, easing: Easing.in(Easing.ease) }))
    opacity.value = withDelay(200, withTiming(0, { duration: 250 }, () => {
      runOnJS(setPhase)('hidden')
      runOnJS(setNotif)(null)
    }))
    bgScale.value = withDelay(200, withSpring(0.8, { damping: 15, stiffness: 200 }))
  }, [])

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = 8 + e.translationY * 0.5
      }
    })
    .onEnd((e) => {
      if (e.translationY < -20) {
        runOnJS(dismiss)()
      } else {
        translateY.value = withSpring(8, { damping: 15, stiffness: 300 })
      }
    })

  useEffect(() => {
    if (!notif) return
    clearTimers()

    // Reset
    translateY.value = -60
    opacity.value = 0
    scaleX.value = 0.35
    scaleY.value = 0.5
    pillOpacity.value = 1
    contentOpacity.value = 0
    contentTranslateY.value = 8
    bgScale.value = 0.8

    setPhase('pill')

    // Phase 1: Appear
    translateY.value = withSpring(8, { damping: 12, stiffness: 120 })
    opacity.value = withSpring(1, { damping: 12, stiffness: 120 })
    bgScale.value = withSpring(1, { damping: 12, stiffness: 120 })

    // Phase 2: Expand
    phaseTimer.current = setTimeout(() => {
      setPhase('expanded')
      scaleX.value = withSpring(1, { damping: 14, stiffness: 100 })
      scaleY.value = withSpring(1, { damping: 14, stiffness: 100 })
      pillOpacity.value = withTiming(0, { duration: 150 })
      contentTranslateY.value = withSpring(0, { damping: 14, stiffness: 100 })
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 250 }))
    }, 400)

    // Auto-dismiss
    dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS)

    return clearTimers
  }, [notif?.id])

  const outerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
      { scale: bgScale.value },
    ],
  }))

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }))

  if (phase === 'hidden' || !notif) return <>{children}</>

  const iconInfo = ICON_MAP[notif.type] || ICON_MAP.info
  const IconComp = iconInfo.Icon
  const isExpanded = phase === 'expanded'

  return (
    <>
      {children}
      <View style={styles.overlay} pointerEvents="box-none">
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.islandOuter, outerStyle]}>
            <TouchableWithoutFeedback onPress={dismiss}>
              <View style={styles.islandBody}>
                {/* Collapsed pill */}
                <Animated.View style={[styles.pillRow, pillStyle]} pointerEvents={isExpanded ? 'none' : 'auto'}>
                  <View style={[styles.pillIcon, { backgroundColor: iconInfo.color + '25' }]}>
                    <IconComp size={11} color={iconInfo.color} />
                  </View>
                  <Text style={styles.pillText} numberOfLines={1}>{notif.title}</Text>
                  <View style={[styles.pillDot, { backgroundColor: iconInfo.color }]} />
                </Animated.View>

                {/* Expanded content */}
                <Animated.View
                  style={[
                    styles.expandedRow,
                    contentStyle,
                    !isExpanded && styles.expandedHidden,
                  ]}
                  pointerEvents={isExpanded ? 'auto' : 'none'}
                >
                  <View style={styles.expandedIconWrap}>
                    <GlowRing color={iconInfo.color} />
                    <View style={[styles.expandedIcon, { backgroundColor: iconInfo.color + '18' }]}>
                      <IconComp size={18} color={iconInfo.color} />
                    </View>
                  </View>
                  <View style={styles.expandedTextWrap}>
                    <Text style={styles.expandedTitle} numberOfLines={1}>{notif.title}</Text>
                    {notif.subtitle ? (
                      <Text style={styles.expandedSub} numberOfLines={1}>{notif.subtitle}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.expandedDot, { backgroundColor: iconInfo.color }]} />
                </Animated.View>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </GestureDetector>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  islandOuter: {
    width: SCREEN_W - 24,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C1C1C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 25,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  islandBody: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 32,
  },

  pillRow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 5,
  },
  pillIcon: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  pillText: {
    fontSize: 10, fontWeight: '700', color: '#D4D4D8',
    maxWidth: 80,
  },
  pillDot: { width: 4, height: 4, borderRadius: 2 },

  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  expandedHidden: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
  },
  expandedIconWrap: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  expandedIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  expandedTextWrap: { flex: 1, minWidth: 0 },
  expandedTitle: {
    fontSize: 13, fontWeight: '700', color: '#FAFAFA',
    letterSpacing: 0.2,
  },
  expandedSub: { fontSize: 11, color: '#71717A', marginTop: 2 },
  expandedDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
})
