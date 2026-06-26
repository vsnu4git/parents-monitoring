import React, { useRef, useEffect, useState, useCallback, memo } from 'react'
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated'
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { useTheme } from '../hooks/useTheme'
import type { StudentCheckIn, GeofenceZone, ODTrip } from '../types/api'

// ── Google Maps dark/brown style ──
const MAP_STYLE_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#1A1008' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1A1008' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#71717A' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#71717A' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#71717A' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1A1508' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A1E10' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1A1008' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1E1E1E' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2A1E10' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#3F3F46' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2A1E10' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0E0A06' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1E1E1E' }] },
]

interface CampusMapProps {
  studentName: string
  isOnCampus: boolean
  currentLat: number
  currentLng: number
  checkInHistory: StudentCheckIn[]
  campusZones: GeofenceZone[]
  odTrip?: ODTrip | null
  lastSeenTime?: string
}

// ── Pulsing radar ripple (Reanimated - UI thread) ──
const RadarRipple = memo(({ color }: { color: string }) => {
  const ring1 = useSharedValue(0)
  const ring2 = useSharedValue(0)

  useEffect(() => {
    ring1.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1, false
    )
    ring2.value = withDelay(
      800,
      withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1, false
      )
    )
    return () => {
      cancelAnimation(ring1)
      cancelAnimation(ring2)
    }
  }, [])

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring1.value, [0, 1], [0.5, 0]),
    transform: [{ scale: interpolate(ring1.value, [0, 1], [0.4, 1.4]) }],
  }))

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring2.value, [0, 1], [0.5, 0]),
    transform: [{ scale: interpolate(ring2.value, [0, 1], [0.4, 1.4]) }],
  }))

  const ringBase = {
    position: 'absolute' as const,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: color,
  }

  return (
    <>
      <Animated.View style={[ringBase, ring1Style]} />
      <Animated.View style={[ringBase, ring2Style]} />
    </>
  )
})

// ── Pulsing dot (Reanimated) ──
const PulsingDot = memo(({ color }: { color: string }) => {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false
    )
    return () => cancelAnimation(opacity)
  }, [])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[styles.pulsingDot, { backgroundColor: color }, style]} />
})

// ── Live badge (Reanimated) ──
const LiveBadge = memo(({ isDark }: { isDark: boolean }) => {
  const blink = useSharedValue(1)

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false
    )
    return () => cancelAnimation(blink)
  }, [])

  const dotStyle = useAnimatedStyle(() => ({ opacity: blink.value }))

  return (
    <View style={[styles.liveBadge, {
      backgroundColor: isDark ? 'rgba(229,57,53,0.15)' : 'rgba(229,57,53,0.1)',
      borderColor: isDark ? '#E53935' : '#C62828',
    }]}>
      <Animated.View style={[styles.liveDot, dotStyle]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  )
})

// ── Zone label marker (memoized to prevent re-renders) ──
const ZoneLabelMarker = memo(({ zone, isDark }: { zone: GeofenceZone; isDark: boolean }) => (
  <Marker
    coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
    anchor={{ x: 0.5, y: 0.5 }}
    tracksViewChanges={false}
    flat
  >
    <View style={[styles.zoneLabelBubble, {
      backgroundColor: isDark ? 'rgba(28,28,28,0.85)' : 'rgba(255,255,255,0.9)',
      borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
    }]}>
      <Text style={[styles.zoneLabelText, { color: isDark ? '#71717A' : '#18181B' }]}>
        {zone.name}
      </Text>
    </View>
  </Marker>
))

// ── History dot marker (memoized) ──
const HistoryDotMarker = memo(({ ci, isDark }: { ci: StudentCheckIn; isDark: boolean }) => (
  <Marker
    coordinate={{ latitude: ci.latitude, longitude: ci.longitude }}
    anchor={{ x: 0.5, y: 0.5 }}
    tracksViewChanges={false}
    flat
  >
    <View style={[styles.historyDot, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
      borderColor: isDark ? '#27272A' : '#18181B',
    }]} />
  </Marker>
))

// ═══════════════════════════════════════════
// Main CampusMap component
// ═══════════════════════════════════════════
export const CampusMap = memo(function CampusMap({
  studentName,
  isOnCampus,
  currentLat,
  currentLng,
  checkInHistory,
  campusZones,
  odTrip,
  lastSeenTime,
}: CampusMapProps) {
  const { c, isDark } = useTheme()
  const mapRef = useRef<MapView>(null)
  const [mapReady, setMapReady] = useState(false)

  const hasStudentCoords = currentLat !== 0 && currentLng !== 0

  // Determine map center: student > zone center > none
  const activeZones = campusZones.filter((z) => z.isActive)
  const mainZone = activeZones.length > 0
    ? activeZones.reduce((a, b) => (a.radiusM > b.radiusM ? a : b), activeZones[0])
    : null

  const centerLat = hasStudentCoords ? currentLat : mainZone?.latitude || 0
  const centerLng = hasStudentCoords ? currentLng : mainZone?.longitude || 0
  const hasAnyCoords = centerLat !== 0 && centerLng !== 0

  const zoomDelta = mainZone
    ? Math.max(0.004, (mainZone.radiusM / 111000) * 3)
    : 0.006

  // Use native map animation for smooth marker movement (no JS thread interpolation)
  const [markerCoord, setMarkerCoord] = useState({ latitude: currentLat, longitude: currentLng })

  useEffect(() => {
    if (!hasStudentCoords) return
    setMarkerCoord({ latitude: currentLat, longitude: currentLng })
  }, [currentLat, currentLng, hasStudentCoords])

  // Animate map camera to follow student
  useEffect(() => {
    if (!hasStudentCoords || !mapReady) return
    mapRef.current?.animateCamera(
      {
        center: { latitude: currentLat, longitude: currentLng },
        zoom: 16,
      },
      { duration: 1000 }
    )
  }, [currentLat, currentLng, mapReady])

  const onMapReady = useCallback(() => setMapReady(true), [])

  // Build movement trail (memoize-friendly)
  const trailCoords = React.useMemo(() => {
    const coords = checkInHistory
      .filter((ci) => ci.latitude && ci.longitude)
      .map((ci) => ({ latitude: ci.latitude, longitude: ci.longitude }))
    if (hasStudentCoords && coords.length > 0) {
      coords.unshift({ latitude: currentLat, longitude: currentLng })
    }
    return coords
  }, [checkInHistory, currentLat, currentLng, hasStudentCoords])

  // OD trip path
  const odPathCoords = React.useMemo(() => {
    if (!odTrip || odTrip.status !== 'IN_TRANSIT') return []
    return [
      { latitude: odTrip.lastLat || currentLat, longitude: odTrip.lastLng || currentLng },
      { latitude: odTrip.destinationLat, longitude: odTrip.destinationLng },
    ]
  }, [odTrip, currentLat, currentLng])

  // Filtered history markers
  const historyMarkers = React.useMemo(() =>
    checkInHistory.filter((ci) => ci.latitude && ci.longitude).slice(1),
    [checkInHistory]
  )

  // Colors
  const zoneStroke = isDark ? '#71717A' : '#18181B'
  const zoneFill = isDark ? 'rgba(0,0,0,0.10)' : 'rgba(0,0,0,0.08)'
  const odZoneStroke = isDark ? '#52525B' : '#71717A'
  const odZoneFill = isDark ? 'rgba(113,113,122,0.12)' : 'rgba(113,113,122,0.10)'
  const trailColor = isDark ? '#FAFAFA' : '#71717A'
  const odPathColor = isDark ? '#71717A' : '#18181B'
  const studentColor = isOnCampus ? '#4CAF50' : '#E53935'

  // No coords at all
  if (!hasAnyCoords) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={c.primary} style={{ marginBottom: 8 }} />
        <Text style={[styles.noDataText, { color: c.textDim }]}>Waiting for location data...</Text>
        <Text style={[styles.noDataSubtext, { color: c.textDarkest }]}>
          Student needs to grant location permissions
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { borderColor: c.border }]}>
      {!mapReady && (
        <View style={[styles.mapLoading, { backgroundColor: c.surface }]}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={isDark ? MAP_STYLE_DARK : []}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: zoomDelta,
          longitudeDelta: zoomDelta,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        onMapReady={onMapReady}
        mapType="standard"
        zoomEnabled
        scrollEnabled
        loadingEnabled
        loadingIndicatorColor={c.primary}
        loadingBackgroundColor={c.surface}
        moveOnMarkerPress={false}
      >
        {/* Campus geofence zones */}
        {activeZones.map((zone) => (
          <React.Fragment key={zone.id}>
            <Circle
              center={{ latitude: zone.latitude, longitude: zone.longitude }}
              radius={zone.radiusM}
              strokeColor={zoneStroke}
              fillColor={zoneFill}
              strokeWidth={1.5}
              lineDashPattern={[6, 4]}
            />
            <ZoneLabelMarker zone={zone} isDark={isDark} />
          </React.Fragment>
        ))}

        {/* OD destination geofence */}
        {odTrip && (
          <>
            <Circle
              center={{ latitude: odTrip.destinationLat, longitude: odTrip.destinationLng }}
              radius={odTrip.radiusM}
              strokeColor={odZoneStroke}
              fillColor={odZoneFill}
              strokeWidth={1.5}
              lineDashPattern={[4, 4]}
            />
            <Marker
              coordinate={{ latitude: odTrip.destinationLat, longitude: odTrip.destinationLng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              flat
            >
              <View style={[styles.destMarker, {
                backgroundColor: isDark ? '#71717A' : '#18181B',
                borderColor: isDark ? '#1C1C1C' : '#27272A',
              }]} />
            </Marker>
          </>
        )}

        {/* Movement trail */}
        {trailCoords.length > 1 && (
          <Polyline
            coordinates={trailCoords}
            strokeColor={trailColor}
            strokeWidth={3}
          />
        )}

        {/* OD path */}
        {odPathCoords.length === 2 && (
          <Polyline
            coordinates={odPathCoords}
            strokeColor={odPathColor}
            strokeWidth={2}
            lineDashPattern={[8, 6]}
          />
        )}

        {/* Check-in history dots */}
        {historyMarkers.map((ci) => (
          <HistoryDotMarker key={ci.id} ci={ci} isDark={isDark} />
        ))}

        {/* ════ STUDENT LIVE MARKER ════ */}
        {hasStudentCoords && (
          <Marker
            coordinate={markerCoord}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            flat={false}
          >
            <View style={styles.studentMarkerContainer}>
              <RadarRipple color={studentColor} />
              <View style={[styles.studentGlow, { backgroundColor: studentColor + '25' }]} />
              <View style={[styles.studentDot, {
                backgroundColor: isOnCampus ? '#FFFFFF' : '#5C1A1A',
                borderColor: studentColor,
                shadowColor: studentColor,
              }]} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* ════ TOP OVERLAY ════ */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.overlayTop}>
        <View style={[styles.statusPill, {
          backgroundColor: isDark ? 'rgba(28,28,28,0.92)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
        }]}>
          <PulsingDot color={hasStudentCoords
            ? (isOnCampus ? (isDark ? '#FFFFFF' : '#2E7D32') : '#E53935')
            : (isDark ? '#71717A' : '#A1A1AA')
          } />
          <Text style={[styles.statusText, {
            color: hasStudentCoords
              ? (isOnCampus ? (isDark ? '#FFFFFF' : '#2E7D32') : '#E53935')
              : (isDark ? '#71717A' : '#A1A1AA'),
          }]}>
            {hasStudentCoords
              ? (isOnCampus ? 'ON CAMPUS' : 'OFF CAMPUS')
              : 'AWAITING LOCATION'}
          </Text>
        </View>

        {hasStudentCoords && <LiveBadge isDark={isDark} />}

        <View style={[styles.namePill, {
          backgroundColor: isDark ? 'rgba(28,28,28,0.92)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
        }]}>
          <Text style={[styles.nameText, { color: isDark ? '#71717A' : '#18181B' }]} numberOfLines={1}>
            {studentName}
          </Text>
        </View>
      </Animated.View>

      {/* ════ BOTTOM LEFT: Last seen time ════ */}
      {lastSeenTime && (
        <Animated.View entering={FadeIn.delay(200).duration(300)} style={[styles.timePill, {
          backgroundColor: isDark ? 'rgba(28,28,28,0.92)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
        }]}>
          <Text style={[styles.timeText, { color: isDark ? '#71717A' : '#A1A1AA' }]}>
            Last seen: {lastSeenTime}
          </Text>
        </Animated.View>
      )}

      {/* No student location banner */}
      {!hasStudentCoords && hasAnyCoords && (
        <Animated.View entering={FadeIn.delay(300).duration(400)} style={[styles.noLocBanner, {
          backgroundColor: isDark ? 'rgba(28,28,28,0.92)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
        }]}>
          <Text style={[styles.noLocText, { color: isDark ? '#FAFAFA' : '#18181B' }]}>
            Showing campus zones — student location not yet available
          </Text>
        </Animated.View>
      )}

      {/* OD Trip banner */}
      {odTrip && hasStudentCoords && (
        <Animated.View entering={FadeIn.delay(200).duration(300)} style={[styles.odBanner, {
          backgroundColor: isDark ? 'rgba(28,28,28,0.92)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)',
        }]}>
          <View style={[styles.odBannerDot, { backgroundColor: isDark ? '#71717A' : '#18181B' }]} />
          <View style={styles.odBannerInfo}>
            <Text style={[styles.odBannerTitle, { color: isDark ? '#E4E4E7' : '#18181B' }]} numberOfLines={1}>
              OD: {odTrip.destinationName}
            </Text>
            <Text style={[styles.odBannerMeta, { color: isDark ? '#71717A' : '#A1A1AA' }]}>
              {odTrip.status.replace(/_/g, ' ')} · {odTrip.radiusM}m geofence
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Zone legend */}
      {!odTrip && activeZones.length > 0 && hasStudentCoords && (
        <Animated.View entering={FadeIn.delay(400).duration(300)} style={[styles.zoneLegend, {
          backgroundColor: isDark ? 'rgba(28,28,28,0.88)' : 'rgba(255,255,255,0.92)',
          borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
        }]}>
          {activeZones.slice(0, 4).map((zone) => (
            <View key={zone.id} style={styles.zoneLegendRow}>
              <View style={[styles.zoneLegendDot, { backgroundColor: zoneStroke }]} />
              <Text style={[styles.zoneLegendText, { color: isDark ? '#71717A' : '#52525B' }]} numberOfLines={1}>
                {zone.name} ({zone.radiusM}m)
              </Text>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    height: 340,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  noDataText: { fontSize: 13, fontWeight: '600' },
  noDataSubtext: { fontSize: 11, marginTop: 4 },

  overlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pulsingDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  namePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 100,
    flexShrink: 1,
  },
  nameText: { fontSize: 9, fontWeight: '600' },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' },
  liveText: { fontSize: 8, fontWeight: '900', color: '#E53935', letterSpacing: 1.5 },

  studentMarkerContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentGlow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  studentDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },

  zoneLabelBubble: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  zoneLabelText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },

  historyDot: { width: 7, height: 7, borderRadius: 3.5, borderWidth: 1 },

  destMarker: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
  },

  timePill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeText: { fontSize: 9, fontWeight: '600', fontVariant: ['tabular-nums'] },

  noLocBanner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  noLocText: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  odBanner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  odBannerDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  odBannerInfo: { flex: 1, minWidth: 0 },
  odBannerTitle: { fontSize: 10, fontWeight: '700' },
  odBannerMeta: { fontSize: 8, marginTop: 1 },

  zoneLegend: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
  },
  zoneLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  zoneLegendDot: { width: 5, height: 5, borderRadius: 2.5 },
  zoneLegendText: { fontSize: 8, fontWeight: '600', maxWidth: 100 },
})
