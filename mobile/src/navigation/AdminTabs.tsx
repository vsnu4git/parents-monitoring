import React from 'react'
import { View, Platform, StyleSheet, TouchableOpacity } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Home, Users, GraduationCap, CreditCard, Menu } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen'
import { AdminStudentsScreen } from '../screens/admin/AdminStudentsScreen'
import { AdminFacultyScreen } from '../screens/admin/AdminFacultyScreen'
import { AdminFeesScreen } from '../screens/admin/AdminFeesScreen'
import { AdminMoreMenuScreen } from '../screens/admin/AdminMoreMenuScreen'
import { AdminNoticesScreen } from '../screens/admin/AdminNoticesScreen'
import { AdminAlertsScreen } from '../screens/admin/AdminAlertsScreen'
import { NoticesScreen } from '../screens/NoticesScreen'
import { CalendarScreen } from '../screens/CalendarScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { useTheme } from '../hooks/useTheme'
import type {
  AdminTabParamList,
  AdminDashboardStackParamList,
  AdminStudentsStackParamList,
  AdminFacultyStackParamList,
  AdminFeesStackParamList,
  AdminMoreStackParamList,
} from '../types/navigation'

const Tab = createBottomTabNavigator<AdminTabParamList>()
const DashStack = createNativeStackNavigator<AdminDashboardStackParamList>()
const StudStack = createNativeStackNavigator<AdminStudentsStackParamList>()
const FacStack = createNativeStackNavigator<AdminFacultyStackParamList>()
const FeeStack = createNativeStackNavigator<AdminFeesStackParamList>()
const MoreStack = createNativeStackNavigator<AdminMoreStackParamList>()

function DashStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <DashStack.Navigator screenOptions={opts}>
      <DashStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
    </DashStack.Navigator>
  )
}

function StudStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <StudStack.Navigator screenOptions={opts}>
      <StudStack.Screen name="AdminStudents" component={AdminStudentsScreen} options={{ title: 'Students' }} />
    </StudStack.Navigator>
  )
}

function FacStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <FacStack.Navigator screenOptions={opts}>
      <FacStack.Screen name="AdminFaculty" component={AdminFacultyScreen} options={{ title: 'Faculty' }} />
    </FacStack.Navigator>
  )
}

function FeeStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <FeeStack.Navigator screenOptions={opts}>
      <FeeStack.Screen name="AdminFees" component={AdminFeesScreen} options={{ title: 'Fee Records' }} />
    </FeeStack.Navigator>
  )
}

function MoreStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <MoreStack.Navigator screenOptions={opts}>
      <MoreStack.Screen name="AdminMoreMenu" component={AdminMoreMenuScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="AdminNotices" component={AdminNoticesScreen} options={{ title: 'Manage Notices' }} />
      <MoreStack.Screen name="AdminAlerts" component={AdminAlertsScreen} options={{ title: 'Emergency Alerts' }} />
      <MoreStack.Screen name="Notices" component={NoticesScreen} />
      <MoreStack.Screen name="Calendar" component={CalendarScreen} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
    </MoreStack.Navigator>
  )
}

// ─── Animated Tab Button ─────────────────────────────────────────────────────

const TAB_SPRING = { damping: 18, stiffness: 200, mass: 0.3 }

const TAB_ICONS: Record<string, typeof Home> = {
  Dashboard: Home,
  Students: Users,
  Faculty: GraduationCap,
  Fees: CreditCard,
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
          const label = options.title ?? route.name.replace('Tab', '').replace('Admin', '')
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

export function AdminTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="AdminDashboardTab" component={DashStackScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="AdminStudentsTab" component={StudStackScreen} options={{ title: 'Students' }} />
      <Tab.Screen name="AdminFacultyTab" component={FacStackScreen} options={{ title: 'Faculty' }} />
      <Tab.Screen name="AdminFeesTab" component={FeeStackScreen} options={{ title: 'Fees' }} />
      <Tab.Screen name="AdminMoreTab" component={MoreStackScreen} options={{ title: 'More' }} listeners={({ navigation }) => ({ tabPress: () => { navigation.navigate('AdminMoreTab' as any, { screen: 'AdminMoreMenu' } as any) } })} />
    </Tab.Navigator>
  )
}
