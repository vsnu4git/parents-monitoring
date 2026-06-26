import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'pms_auth_token'
const USER_KEY = 'pms_user_data'

// SecureStore doesn't work on web, use a simple in-memory fallback
const memoryStore: Record<string, string> = {}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') return memoryStore[TOKEN_KEY] || null
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore[TOKEN_KEY] = token
    return
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    delete memoryStore[TOKEN_KEY]
    return
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function getUserData(): Promise<string | null> {
  if (Platform.OS === 'web') return memoryStore[USER_KEY] || null
  return SecureStore.getItemAsync(USER_KEY)
}

export async function setUserData(data: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore[USER_KEY] = data
    return
  }
  await SecureStore.setItemAsync(USER_KEY, data)
}

export async function removeUserData(): Promise<void> {
  if (Platform.OS === 'web') {
    delete memoryStore[USER_KEY]
    return
  }
  await SecureStore.deleteItemAsync(USER_KEY)
}
