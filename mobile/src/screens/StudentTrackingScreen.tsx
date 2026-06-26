import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  AppState,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  FadeInDown,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { MapPin, Shield, Radio, LogOut, CheckCircle, AlertTriangle } from 'lucide-react-native'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../hooks/useTheme'
import {
  isTrackingActive,
  ensureTrackingActive,
  getCurrentLocation,
  startForegroundTracking,
  startBackgroundTracking,
  requestLocationPermissions,
} from '../services/LocationService'

export function StudentTrackingScreen() {
  const { c, spacing, isDark } = useTheme()
  const { user, logout } = useAuth()
  const [trackingStatus, setTrackingStatus] = useState<'checking' | 'active' | 'inactive' | 'denied'>('checking')
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null)

  const pulseScale = useSharedValue(1)

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.3, { duration: 1500 }),
      -1, true
    )
    return () => cancelAnimation(pulseScale)
  }, [])

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  const checkTracking = useCallback(async () => {
    try {
      const active = await isTrackingActive()
      if (active) {
        setTrackingStatus('active')
      } else {
        // Try to start
        const hasPerms = await requestLocationPermissions()
        if (!hasPerms) {
          setTrackingStatus('denied')
          return
        }
        await startForegroundTracking()
        await startBackgroundTracking()
        setTrackingStatus('active')
      }

      // Get current location
      const loc = await getCurrentLocation()
      if (loc) setCurrentCoords({ lat: loc.latitude, lng: loc.longitude })
    } catch {
      setTrackingStatus('inactive')
    }
  }, [])

  useEffect(() => {
    checkTracking()

    // Re-check when app comes to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        ensureTrackingActive()
        checkTracking()
      }
    })
    return () => sub.remove()
  }, [checkTracking])

  // Periodically refresh location
  useEffect(() => {
    const interval = setInterval(async () => {
      const loc = await getCurrentLocation()
      if (loc) setCurrentCoords({ lat: loc.latitude, lng: loc.longitude })
      const active = await isTrackingActive()
      setTrackingStatus(active ? 'active' : 'inactive')
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const statusConfig = {
    checking: { color: c.textSecondary, label: 'Checking...', icon: Radio },
    active: { color: '#4CAF50', label: 'Location Sharing Active', icon: CheckCircle },
    inactive: { color: c.warning, label: 'Tracking Stopped', icon: AlertTriangle },
    denied: { color: c.error, label: 'Permission Denied', icon: AlertTriangle },
  }
  const status = statusConfig[trackingStatus]
  const StatusIcon = status.icon

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.lg }]}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(350).springify().damping(18)}>
      <LinearGradient
        colors={[c.headerGradientStart, c.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerCard, { borderColor: c.border }]}
      >
        <View style={styles.headerRow}>
          <MapPin size={16} color={c.primary} />
          <Text style={[styles.headerLabel, { color: c.textTertiary }]}>LOCATION TRACKING</Text>
        </View>
        <Text style={[styles.headerName, { color: c.text }]}>
          Hi, {user?.name || 'Student'}
        </Text>
        <Text style={[styles.headerSub, { color: c.textSecondary }]}>
          Your location is being shared with your parent
        </Text>
      </LinearGradient>
      </Animated.View>

      {/* Tracking Status */}
      <View style={[styles.statusCard, { backgroundColor: c.surface, borderColor: status.color + '30' }]}>
        <View style={styles.statusCenter}>
          {/* Pulsing ring */}
          <Animated.View style={[
            styles.pulseRing,
            {
              borderColor: status.color,
              opacity: trackingStatus === 'active' ? 0.3 : 0,
            },
            pulseAnimStyle,
          ]} />
          <View style={[styles.statusIconCircle, { backgroundColor: status.color + '20', borderColor: status.color + '40' }]}>
            <StatusIcon size={32} color={status.color} />
          </View>
        </View>

        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>

        {trackingStatus === 'active' && (
          <Text style={[styles.statusDetail, { color: c.textSecondary }]}>
            Sending location updates every 10 seconds
          </Text>
        )}

        {trackingStatus === 'denied' && (
          <Text style={[styles.statusDetail, { color: c.textSecondary }]}>
            Please grant location permissions in Settings to enable tracking
          </Text>
        )}

        {trackingStatus === 'inactive' && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: c.primary }]}
            onPress={checkTracking}
            activeOpacity={0.7}
          >
            <Text style={[styles.retryText, { color: c.buttonText }]}>Restart Tracking</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Location Info */}
      {currentCoords && (
        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.infoRow}>
            <Shield size={16} color={c.primary} />
            <Text style={[styles.infoTitle, { color: c.text }]}>Current Position</Text>
          </View>
          <Text style={[styles.infoCoords, { color: c.textSecondary }]}>
            {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
          </Text>
        </View>
      )}

      {/* How it works */}
      <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.howTitle, { color: c.primary }]}>How it works</Text>
        {[
          'Your location is sent to the campus server every few seconds',
          'Your parent can see your real-time position on a map',
          'Geofence alerts are generated when you enter or leave campus',
          'Tracking continues when the app is in the background',
        ].map((text, i) => (
          <View key={i} style={styles.howRow}>
            <View style={[styles.howDot, { backgroundColor: c.primary }]} />
            <Text style={[styles.howText, { color: c.textSecondary }]}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: c.dangerBorder }]}
        onPress={logout}
        activeOpacity={0.7}
      >
        <LogOut size={18} color={c.error} />
        <Text style={[styles.logoutText, { color: c.error }]}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 16 },

  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' },
  headerName: { fontSize: 24, fontWeight: '900', marginTop: 8 },
  headerSub: { fontSize: 13, marginTop: 4 },

  statusCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  statusCenter: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusDetail: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
  },

  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: { fontSize: 14, fontWeight: '600' },
  infoCoords: { fontSize: 12, marginTop: 4, fontVariant: ['tabular-nums'] },

  howTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  howDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  howText: { fontSize: 12, lineHeight: 18, flex: 1 },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: { fontSize: 14, fontWeight: '600' },
})
