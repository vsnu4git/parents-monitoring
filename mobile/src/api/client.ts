import Constants from 'expo-constants'
import { getToken, removeToken, removeUserData } from '../utils/storage'

// Auto-detect dev machine IP from Expo, fallback to hardcoded
function getBaseUrl() {
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0]
    return `http://${ip}:3000`
  }
  return 'http://172.168.7.134:3000'
}

const BASE_URL = getBaseUrl()

let logoutCallback: (() => void) | null = null

export function setLogoutCallback(cb: () => void) {
  logoutCallback = cb
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const url = `${BASE_URL}/api/mobile${endpoint}`

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (err: any) {
    // Network error — server unreachable, DNS failure, timeout, etc.
    throw new Error(
      `Cannot reach server. Make sure the Next.js dev server is running on port 3000.\n(${err.message})`
    )
  }

  if (response.status === 401) {
    await removeToken()
    await removeUserData()
    logoutCallback?.()
    throw new Error('Session expired')
  }

  // Parse response body — handle non-JSON (e.g. HTML error pages) gracefully
  let data: any
  try {
    data = await response.json()
  } catch {
    throw new Error(
      `Server returned an invalid response (HTTP ${response.status}). The API route may have crashed.`
    )
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (HTTP ${response.status})`)
  }

  return data as T
}
