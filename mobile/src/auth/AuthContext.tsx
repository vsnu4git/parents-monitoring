import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getToken, setToken, removeToken, getUserData, setUserData, removeUserData } from '../utils/storage'
import { setLogoutCallback, apiClient } from '../api/client'
import { login as loginApi } from '../api/endpoints'
import {
  setTrackingStudentId,
  startForegroundTracking,
  startBackgroundTracking,
  stopForegroundTracking,
  stopBackgroundTracking,
} from '../services/LocationService'
import type { User } from '../types/api'

interface AuthUser extends User {
  role: string
  studentId?: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isStudent: boolean
  isAdmin: boolean
  isFaculty: boolean
  login: (email: string, password: string) => Promise<void>
  loginAsStudent: (registerNumber: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isStudent: false,
  isAdmin: false,
  isFaculty: false,
  login: async () => {},
  loginAsStudent: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isStudent = user?.role === 'STUDENT'
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isFaculty = user?.role === 'FACULTY'

  const logout = useCallback(async () => {
    // Stop location tracking on logout
    stopForegroundTracking()
    await stopBackgroundTracking()

    await removeToken()
    await removeUserData()
    setUser(null)
    setTokenState(null)
  }, [])

  useEffect(() => {
    setLogoutCallback(logout)
  }, [logout])

  // Restore session and restart tracking if student
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getToken()
        const storedUser = await getUserData()
        if (storedToken && storedUser) {
          setTokenState(storedToken)
          const parsed = JSON.parse(storedUser) as AuthUser
          setUser(parsed)

          // Restart location tracking for students
          if (parsed.role === 'STUDENT' && parsed.studentId) {
            setTrackingStudentId(parsed.studentId)
            await startForegroundTracking()
            await startBackgroundTracking()
          }
        }
      } catch {
        await removeToken()
        await removeUserData()
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  // Parent login
  const login = useCallback(async (email: string, password: string) => {
    const result = await loginApi(email, password)
    const authUser: AuthUser = { ...result.user, role: result.user.role || 'PARENT' }
    await setToken(result.token)
    await setUserData(JSON.stringify(authUser))
    setTokenState(result.token)
    setUser(authUser)
  }, [])

  // Student login
  const loginAsStudent = useCallback(async (registerNumber: string, password: string) => {
    const result = await apiClient<{
      token: string
      user: { id: string; name: string; email: string; role: string }
      student: { id: string; registerNumber: string; name: string }
    }>('/auth/student-login', {
      method: 'POST',
      body: JSON.stringify({ registerNumber, password }),
    })

    const authUser: AuthUser = {
      ...result.user,
      role: 'STUDENT',
      studentId: result.student.id,
    }

    await setToken(result.token)
    await setUserData(JSON.stringify(authUser))
    setTokenState(result.token)
    setUser(authUser)

    // Start location tracking immediately
    setTrackingStudentId(result.student.id)
    await startForegroundTracking()
    await startBackgroundTracking()
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isStudent, isAdmin, isFaculty, login, loginAsStudent, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
