import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import Constants from 'expo-constants'
import { getToken } from '../utils/storage'

const LOCATION_TASK_NAME = 'pms-background-location'

// Use the same base URL detection as the API client
function getBaseUrl() {
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0]
    return `http://${ip}:3000`
  }
  return 'http://172.168.7.134:3000'
}

let studentId: string | null = null
let lastCheckInTime = 0
const MIN_CHECKIN_INTERVAL = 8000 // 8s minimum between check-ins to avoid flooding

// ── Set the student ID for check-in API calls ──
export function setTrackingStudentId(id: string) {
  studentId = id
}

// ── Send a check-in to the backend ──
async function sendCheckIn(latitude: number, longitude: number) {
  if (!studentId) return

  // Throttle check-ins
  const now = Date.now()
  if (now - lastCheckInTime < MIN_CHECKIN_INTERVAL) return
  lastCheckInTime = now

  const token = await getToken()
  if (!token) return

  const baseUrl = getBaseUrl()

  try {
    const response = await fetch(`${baseUrl}/api/mobile/student/${studentId}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude,
        longitude,
        type: 'AUTO',
      }),
    })
    if (!response.ok) {
      console.warn('Check-in response not ok:', response.status)
    }
  } catch (e) {
    // Silently fail — network issues shouldn't crash the app
    console.warn('Check-in failed:', e)
  }
}

// ── Define the background task ──
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.warn('Background location error:', error)
    return
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] }
    if (locations && locations.length > 0) {
      const latest = locations[locations.length - 1]
      await sendCheckIn(latest.coords.latitude, latest.coords.longitude)
    }
  }
})

// ── Request permissions ──
export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foreground } = await Location.requestForegroundPermissionsAsync()
  if (foreground !== 'granted') return false

  const { status: background } = await Location.requestBackgroundPermissionsAsync()
  if (background !== 'granted') {
    // Background not granted — foreground-only tracking still works
    console.warn('Background location not granted, using foreground only')
  }

  return true
}

// ── Start foreground location tracking ──
let foregroundSubscription: Location.LocationSubscription | null = null

export async function startForegroundTracking() {
  if (foregroundSubscription) return // already tracking

  const hasPermission = await requestLocationPermissions()
  if (!hasPermission) return

  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // every 10 seconds
      distanceInterval: 5, // or if moved 5 meters
    },
    (location) => {
      sendCheckIn(location.coords.latitude, location.coords.longitude)
    }
  )
}

// ── Stop foreground tracking ──
export function stopForegroundTracking() {
  if (foregroundSubscription) {
    foregroundSubscription.remove()
    foregroundSubscription = null
  }
}

// ── Start background tracking (persists when app is minimized) ──
export async function startBackgroundTracking() {
  const hasPermission = await requestLocationPermissions()
  if (!hasPermission) return

  const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false)
  if (isTracking) return // already running

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 30000, // every 30 seconds in background
    distanceInterval: 10, // or if moved 10 meters
    deferredUpdatesInterval: 30000,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'PMS Location Tracking',
      notificationBody: 'Your campus location is being shared with your parent',
      notificationColor: '#C4973B',
    },
  })
}

// ── Stop background tracking ──
export async function stopBackgroundTracking() {
  const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false)
  if (isTracking) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
  }
}

// ── Get current location once ──
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  const hasPermission = await requestLocationPermissions()
  if (!hasPermission) return null

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  })

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  }
}

// ── Check if tracking is active ──
export async function isTrackingActive(): Promise<boolean> {
  const bg = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false)
  return bg || foregroundSubscription !== null
}

// ── Ensure tracking is running (restart if killed by OS) ──
export async function ensureTrackingActive() {
  const isActive = await isTrackingActive()
  if (!isActive && studentId) {
    console.warn('Tracking was not active, restarting...')
    await startForegroundTracking()
    await startBackgroundTracking()
  }
}
