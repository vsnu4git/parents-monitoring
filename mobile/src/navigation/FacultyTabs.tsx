import React from 'react'
import { View, Platform, StyleSheet, TouchableOpacity } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Home, Users, ClipboardCheck, FileEdit, Menu } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FacultyDashboardScreen } from '../screens/faculty/FacultyDashboardScreen'
import { FacultyStudentsScreen } from '../screens/faculty/FacultyStudentsScreen'
import { FacultyAttendanceScreen } from '../screens/faculty/FacultyAttendanceScreen'
import { FacultyMarksScreen } from '../screens/faculty/FacultyMarksScreen'
import { FacultyMoreMenuScreen } from '../screens/faculty/FacultyMoreMenuScreen'
import { FacultyLeavesScreen } from '../screens/faculty/FacultyLeavesScreen'
import { NoticesScreen } from '../screens/NoticesScreen'
import { CalendarScreen } from '../screens/CalendarScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { ChatListScreen } from '../screens/ChatListScreen'
import { ChatDetailScreen } from '../screens/ChatDetailScreen'
import { useTheme } from '../hooks/useTheme'
import type {
  FacultyTabParamList,
  FacultyDashboardStackParamList,
  FacultyStudentsStackParamList,
  FacultyAttendanceStackParamList,
  FacultyMarksStackParamList,
  FacultyMoreStackParamList,
} from '../types/navigation'

const Tab = createBottomTabNavigator<FacultyTabParamList>()
const DashStack = createNativeStackNavigator<FacultyDashboardStackParamList>()
const StudStack = createNativeStackNavigator<FacultyStudentsStackParamList>()
const AttStack = createNativeStackNavigator<FacultyAttendanceStackParamList>()
const MrkStack = createNativeStackNavigator<FacultyMarksStackParamList>()
const MoreStack = createNativeStackNavigator<FacultyMoreStackParamList>()

function DashStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <DashStack.Navigator screenOptions={opts}>
      <DashStack.Screen name="FacultyDashboard" component={FacultyDashboardScreen} options={{ title: 'Faculty Dashboard' }} />
    </DashStack.Navigator>
  )
}

function StudStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <StudStack.Navigator screenOptions={opts}>
      <StudStack.Screen name="FacultyStudents" component={FacultyStudentsScreen} options={{ title: 'My Students' }} />
    </StudStack.Navigator>
  )
}

function AttStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <AttStack.Navigator screenOptions={opts}>
      <AttStack.Screen name="FacultyAttendance" component={FacultyAttendanceScreen} options={{ title: 'Attendance' }} />
    </AttStack.Navigator>
  )
}

function MrkStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <MrkStack.Navigator screenOptions={opts}>
      <MrkStack.Screen name="FacultyMarks" component={FacultyMarksScreen} options={{ title: 'Enter Marks' }} />
    </MrkStack.Navigator>
  )
}

function MoreStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <MoreStack.Navigator screenOptions={opts}>
      <MoreStack.Screen name="FacultyMoreMenu" component={FacultyMoreMenuScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="FacultyLeaves" component={FacultyLeavesScreen} options={{ title: 'Leave Requests' }} />
      <MoreStack.Screen name="Notices" component={NoticesScreen} />
      <MoreStack.Screen name="Calendar" component={CalendarScreen} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
      <MoreStack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Parent Chat' }} />
      <MoreStack.Screen name="ChatDetail" component={ChatDetailScreen} options={({ route }: any) => ({ title: route.params?.facultyName || 'Chat' })} />
    </MoreStack.Navigator>
  )
}

// ─── Animated Tab Button ─────────────────────────────────────────────────────

const TAB_SPRING = { damping: 18, stiffness: 200, mass: 0.3 }

const TAB_ICONS: Record<string, typeof Home> = {
  Dashboard: Home,
  Students: Users,
  Attendance: ClipboardCheck,
  Marks: FileEdit,
  More: Menu,
}

function AnimatedTabButton({
  label, isFocused, onPress, onLongPress, primaryColor, inactiveColor,
}: {
  label: string; isFocused: boolean; onPress: () => void; onLongPress: () => void; primaryColor: string; inactiveColor: string
}) {
  const Icon = TAB_ICONS[label] || Home
  const scale = useSharedValue(1)
  const focused = useSharedValue(isFocused ? 1 : 0)

  React.useEffect(() => {
    focused.value = withSpring(isFocused ? 1 : 0, TAB_SPRING)
    scale.value = withSpring(isFocused ? 1.05 : 1, TAB_SPRING)
  }, [isFocused])

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const pillStyle = useAnimatedStyle(() => ({ opacity: focused.value * 0.15, transform: [{ scaleX: 0.6 + focused.value * 0.4 }] }))
  const color = isFocused ? primaryColor : inactiveColor

  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={isFocused ? { selected: true } : {}} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7} style={tabStyles.tabButton}>
      <Animated.View style={[tabStyles.pill, { backgroundColor: primaryColor }, pillStyle]} />
      <Animated.View style={iconStyle}>
        <Icon size={21} color={color} strokeWidth={isFocused ? 2.5 : 1.5} />
      </Animated.View>
      <Animated.Text style={[tabStyles.label, { color, fontWeight: isFocused ? '700' : '500' }]} numberOfLines={1}>{label}</Animated.Text>
    </TouchableOpacity>
  )
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { c, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const tabBarBg = isDark ? 'rgba(8,6,4,0.92)' : 'rgba(255,255,255,0.88)'
  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'

  return (
    <View style={[tabStyles.barContainer, { paddingBottom: Math.max(insets.bottom, 4), backgroundColor: tabBarBg, borderTopColor: borderColor }]}>
      <View style={[tabStyles.topBorder, { backgroundColor: borderColor }]} />
      <View style={tabStyles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key]
          const label = options.title ?? route.name.replace('Tab', '').replace('Faculty', '')
          const isFocused = state.index === index
          const onPress = () => { const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!isFocused && !e.defaultPrevented) navigation.navigate(route.name, route.params) }
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key })
          return <AnimatedTabButton key={route.key} label={label} isFocused={isFocused} onPress={onPress} onLongPress={onLongPress} primaryColor={c.primary} inactiveColor={c.textSecondary} />
        })}
      </View>
    </View>
  )
}

const tabStyles = StyleSheet.create({
  barContainer: { borderTopWidth: StyleSheet.hairlineWidth, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 8 } }) },
  topBorder: { height: StyleSheet.hairlineWidth, width: '100%' },
  tabRow: { flexDirection: 'row', paddingTop: 6, paddingHorizontal: 4 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  pill: { position: 'absolute', top: 0, width: 48, height: 32, borderRadius: 16 },
  label: { fontSize: 10, marginTop: 2, letterSpacing: 0.2 },
})

export function FacultyTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="FacultyDashboardTab" component={DashStackScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="FacultyStudentsTab" component={StudStackScreen} options={{ title: 'Students' }} />
      <Tab.Screen name="FacultyAttendanceTab" component={AttStackScreen} options={{ title: 'Attendance' }} />
      <Tab.Screen name="FacultyMarksTab" component={MrkStackScreen} options={{ title: 'Marks' }} />
      <Tab.Screen name="FacultyMoreTab" component={MoreStackScreen} options={{ title: 'More' }} listeners={({ navigation }) => ({ tabPress: () => { navigation.navigate('FacultyMoreTab' as any, { screen: 'FacultyMoreMenu' } as any) } })} />
    </Tab.Navigator>
  )
}
