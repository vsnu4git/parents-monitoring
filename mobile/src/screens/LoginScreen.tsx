import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../hooks/useTheme'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

type LoginMode = 'parent' | 'student'

export function LoginScreen() {
  const { c, spacing, isDark } = useTheme()
  const { login, loginAsStudent } = useAuth()

  const [mode, setMode] = useState<LoginMode>('parent')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const buttonScale = useSharedValue(1)
  const emailBorderProgress = useSharedValue(0)
  const passwordBorderProgress = useSharedValue(0)

  useEffect(() => {
    emailBorderProgress.value = withTiming(emailFocused ? 1 : 0, { duration: 200 })
  }, [emailFocused])

  useEffect(() => {
    passwordBorderProgress.value = withTiming(passwordFocused ? 1 : 0, { duration: 200 })
  }, [passwordFocused])

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  const defaultBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'

  const emailInputStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(emailBorderProgress.value, [0, 1], [defaultBorder, c.primary]),
  }))

  const passwordInputStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(passwordBorderProgress.value, [0, 1], [defaultBorder, c.primary]),
  }))

  const handlePressIn = useCallback(() => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 300 })
  }, [])

  const handlePressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 })
  }, [])

  // Clear fields on mode switch
  const switchMode = (newMode: LoginMode) => {
    setMode(newMode)
    setEmail('')
    setPassword('')
  }

  const handleLogin = async () => {
    setLoading(true)
    try {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Error', mode === 'parent' ? 'Please enter email and password' : 'Please enter register number and password')
        return
      }
      if (mode === 'parent') {
        await login(email.trim(), password)
      } else {
        await loginAsStudent(email.trim(), password)
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        gradient: { flex: 1 },
        inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
        header: { alignItems: 'center', marginBottom: spacing.xl },
        logo: { fontSize: 48, fontWeight: '900', color: c.primary, letterSpacing: 8 },
        systemName: {
          fontSize: 11, fontWeight: '600', color: c.textSecondary,
          letterSpacing: 2, textTransform: 'uppercase', marginTop: spacing.xs,
        },
        subtitle: {
          fontSize: 14, color: c.textSecondary, marginTop: spacing.lg,
          textAlign: 'center', lineHeight: 20,
        },
        card: {
          backgroundColor: isDark ? 'rgba(26,26,26,0.85)' : 'rgba(255,255,255,0.9)',
          borderRadius: 20, padding: spacing.lg,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          ...(Platform.OS === 'ios'
            ? { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 }
            : { elevation: 8 }),
        },
        form: { gap: spacing.md },
        inputGroup: { gap: spacing.xs },
        label: { fontSize: 13, fontWeight: '600', color: c.textSecondary, letterSpacing: 0.3 },
        input: {
          backgroundColor: c.inputBg, borderWidth: 1.5, borderRadius: 12,
          paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? 15 : 13,
          fontSize: 16, color: c.text,
        },
        button: { borderRadius: 12, marginTop: spacing.sm },
        buttonInner: {
          backgroundColor: c.primary, paddingVertical: 15,
          alignItems: 'center' as const, justifyContent: 'center' as const,
          flexDirection: 'row' as const, gap: spacing.sm, borderRadius: 12,
        },
        buttonDisabled: { opacity: 0.6 },
        buttonText: { color: c.buttonText, fontSize: 16, fontWeight: '700' },
        hint: {
          fontSize: 11, color: c.textMuted, textAlign: 'center' as const,
          marginTop: spacing.lg, lineHeight: 18,
        },
        // Mode toggle
        modeToggle: {
          flexDirection: 'row' as const,
          marginBottom: spacing.lg,
          borderRadius: 12,
          overflow: 'hidden' as const,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
        },
        modeButton: {
          flex: 1,
          paddingVertical: 12,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        },
        modeActive: {
          backgroundColor: c.primary,
        },
        modeInactive: {
          backgroundColor: isDark ? 'rgba(26,26,26,0.6)' : 'rgba(255,255,255,0.6)',
        },
        modeTextActive: {
          color: c.buttonText,
          fontSize: 13,
          fontWeight: '700' as const,
          letterSpacing: 0.5,
        },
        modeTextInactive: {
          color: c.textSecondary,
          fontSize: 13,
          fontWeight: '500' as const,
          letterSpacing: 0.5,
        },
      }),
    [c, spacing, isDark],
  )

  return (
    <View style={s.container}>
      <LinearGradient
        colors={[c.gradientStart, c.gradientMid, c.gradientEnd]}
        style={s.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.inner}>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={s.header}>
              <Text style={s.logo}>PMS</Text>
              <Text style={s.systemName}>Parent Management System</Text>
              <Text style={s.subtitle}>
                {mode === 'parent'
                  ? 'Sign in as Admin, Faculty, or Parent'
                  : 'Sign in to share your location with your parent'}
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(500).delay(200)} style={s.card}>
              {/* Staff & Parent / Student toggle */}
              <View style={s.modeToggle}>
                <TouchableOpacity
                  style={[s.modeButton, mode === 'parent' ? s.modeActive : s.modeInactive]}
                  onPress={() => switchMode('parent')}
                  activeOpacity={0.8}
                >
                  <Text style={mode === 'parent' ? s.modeTextActive : s.modeTextInactive}>
                    Staff / Parent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modeButton, mode === 'student' ? s.modeActive : s.modeInactive]}
                  onPress={() => switchMode('student')}
                  activeOpacity={0.8}
                >
                  <Text style={mode === 'student' ? s.modeTextActive : s.modeTextInactive}>
                    Student
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={s.form}>
                <View style={s.inputGroup}>
                  <Text style={s.label}>{mode === 'parent' ? 'Email' : 'Register Number'}</Text>
                  <Animated.View style={[s.input, emailInputStyle, { padding: 0 }]}>
                    <TextInput
                      style={{ paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? 15 : 13, fontSize: 16, color: c.text, flex: 1 }}
                      value={email}
                      onChangeText={setEmail}
                      placeholder={mode === 'parent' ? 'your@email.com' : 'e.g. 2021CS001'}
                      placeholderTextColor={c.textTertiary}
                      keyboardType={mode === 'parent' ? 'email-address' : 'default'}
                      autoCapitalize={mode === 'parent' ? 'none' : 'characters'}
                      autoCorrect={false}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </Animated.View>
                </View>

                <View style={s.inputGroup}>
                  <Text style={s.label}>Password</Text>
                  <Animated.View style={[s.input, passwordInputStyle, { padding: 0 }]}>
                    <TextInput
                      style={{ paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? 15 : 13, fontSize: 16, color: c.text, flex: 1 }}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor={c.textTertiary}
                      secureTextEntry
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                  </Animated.View>
                </View>

                <AnimatedTouchable
                  style={[s.button, buttonAnimatedStyle, loading && s.buttonDisabled]}
                  onPress={handleLogin}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <View style={s.buttonInner}>
                    {loading && <ActivityIndicator size="small" color={c.buttonText} />}
                    <Text style={s.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
                  </View>
                </AnimatedTouchable>
              </View>
            </Animated.View>

            <Animated.Text entering={FadeInDown.duration(400).delay(350)} style={s.hint}>
              {mode === 'parent'
                ? 'Admin, Faculty, and Parent accounts use email to sign in.'
                : 'Use your register number and date of birth (DDMMYYYY) to sign in.\nLocation tracking will start automatically.'}
            </Animated.Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  )
}
