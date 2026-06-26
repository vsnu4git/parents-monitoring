import React from 'react'
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { TouchableOpacity, View, Text, Platform, StyleSheet } from 'react-native'
import { Home, BookOpen, BarChart3, Calendar, User, MapPin } from 'lucide-react-native'
import { useAuth } from '../auth/AuthContext'
import { useThemeMode } from '../theme/ThemeContext'
import { darkColors, lightColors } from '../theme'
import { LoadingScreen } from '../components/LoadingScreen'
import { AuthStack } from './AuthStack'
import { MainTabs } from './MainTabs'
import { AdminTabs } from './AdminTabs'
import { FacultyTabs } from './FacultyTabs'
import { StudentTrackingScreen } from '../screens/StudentTrackingScreen'
import { AcademicsScreen } from '../screens/AcademicsScreen'
import { FeesScreen } from '../screens/FeesScreen'
import { CalendarScreen } from '../screens/CalendarScreen'
import { NoticesScreen } from '../screens/NoticesScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { LeaveRecordsScreen } from '../screens/LeaveRecordsScreen'

const StudentTab = createBottomTabNavigator()
const StudentHomeStack = createNativeStackNavigator()
const StudentAcademicsStack = createNativeStackNavigator()
const StudentAttendanceStack = createNativeStackNavigator()
const StudentMoreStack = createNativeStackNavigator()

function StudentHomeStackScreen() {
  const { isDark } = useThemeMode()
  const c = isDark ? darkColors : lightColors
  return (
    <StudentHomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '700', color: c.primary },
      }}
    >
      <StudentHomeStack.Screen name="StudentTracking" component={StudentTrackingScreen} options={{ title: 'PMS Tracking' }} />
    </StudentHomeStack.Navigator>
  )
}

function StudentAcademicsStackScreen() {
  const { isDark } = useThemeMode()
  const c = isDark ? darkColors : lightColors
  return (
    <StudentAcademicsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '700', color: c.primary },
      }}
    >
      <StudentAcademicsStack.Screen name="Academics" component={AcademicsScreen} />
      <StudentAcademicsStack.Screen name="Fees" component={FeesScreen} />
    </StudentAcademicsStack.Navigator>
  )
}

function StudentAttendanceStackScreen() {
  const { isDark } = useThemeMode()
  const c = isDark ? darkColors : lightColors
  return (
    <StudentAttendanceStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '700', color: c.primary },
      }}
    >
      <StudentAttendanceStack.Screen name="Fees" component={FeesScreen} />
      <StudentAttendanceStack.Screen name="LeaveRecords" component={LeaveRecordsScreen} options={{ title: 'Leave / OD' }} />
    </StudentAttendanceStack.Navigator>
  )
}

function StudentMoreStackScreen() {
  const { isDark } = useThemeMode()
  const c = isDark ? darkColors : lightColors
  return (
    <StudentMoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '700', color: c.primary },
      }}
    >
      <StudentMoreStack.Screen name="Calendar" component={CalendarScreen} />
      <StudentMoreStack.Screen name="Notices" component={NoticesScreen} />
      <StudentMoreStack.Screen name="Profile" component={ProfileScreen} />
    </StudentMoreStack.Navigator>
  )
}

function StudentNavigator() {
  const { isDark } = useThemeMode()
  const c = isDark ? darkColors : lightColors

  return (
    <StudentTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <View style={[tabStyles.bar, {
          backgroundColor: isDark ? 'rgba(8,6,4,0.92)' : 'rgba(255,255,255,0.88)',
          borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
          paddingBottom: Platform.OS === 'ios' ? 20 : 4,
        }]}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index
            const icons: Record<string, typeof Home> = {
              TrackingTab: MapPin,
              AcademicsTab: BookOpen,
              FeesTab: BarChart3,
              MoreTab: Calendar,
            }
            const labels: Record<string, string> = {
              TrackingTab: 'Tracking',
              AcademicsTab: 'Academics',
              FeesTab: 'Fees',
              MoreTab: 'More',
            }
            const Icon = icons[route.name] || Home
            const label = labels[route.name] || route.name

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={tabStyles.tab}
                activeOpacity={0.7}
              >
                <Icon size={21} color={isFocused ? c.primary : c.textSecondary} strokeWidth={isFocused ? 2.5 : 1.5} />
                <Text style={[tabStyles.label, { color: isFocused ? c.primary : c.textSecondary, fontWeight: isFocused ? '700' : '500' }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    >
      <StudentTab.Screen name="TrackingTab" component={StudentHomeStackScreen} />
      <StudentTab.Screen name="AcademicsTab" component={StudentAcademicsStackScreen} />
      <StudentTab.Screen name="FeesTab" component={StudentAttendanceStackScreen} />
      <StudentTab.Screen name="MoreTab" component={StudentMoreStackScreen} />
    </StudentTab.Navigator>
  )
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
})

function getNavigator(token: string | null, isStudent: boolean, isAdmin: boolean, isFaculty: boolean) {
  if (!token) return <AuthStack />
  if (isStudent) return <StudentNavigator />
  if (isAdmin) return <AdminTabs />
  if (isFaculty) return <FacultyTabs />
  return <MainTabs /> // Parent (default)
}

export function RootNavigator() {
  const { token, isLoading, isStudent, isAdmin, isFaculty } = useAuth()
  const { isDark } = useThemeMode()

  if (isLoading) return <LoadingScreen />

  const c = isDark ? darkColors : lightColors
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: c.primary,
      background: c.background,
      card: c.surface,
      text: c.text,
      border: c.border,
      notification: c.error,
    },
  }

  return (
    <NavigationContainer theme={navTheme}>
      {getNavigator(token, isStudent, isAdmin, isFaculty)}
    </NavigationContainer>
  )
}
