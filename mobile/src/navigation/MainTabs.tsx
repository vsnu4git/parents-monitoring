import React from 'react'
import { View, Platform, StyleSheet, TouchableOpacity } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Home, BookOpen, MapPin, MessageSquare, Menu } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DashboardScreen } from '../screens/DashboardScreen'
import { AcademicsScreen } from '../screens/AcademicsScreen'
import { FeesScreen } from '../screens/FeesScreen'
import { MonitorScreen } from '../screens/MonitorScreen'
import { ODTrackerScreen } from '../screens/ODTrackerScreen'
import { ExpensesScreen } from '../screens/ExpensesScreen'
import { FoodScreen } from '../screens/FoodScreen'
import { GeofenceAlertsScreen } from '../screens/GeofenceAlertsScreen'
import { TicketsListScreen } from '../screens/TicketsListScreen'
import { TicketDetailScreen } from '../screens/TicketDetailScreen'
import { CreateTicketScreen } from '../screens/CreateTicketScreen'
import { MoreMenuScreen } from '../screens/MoreMenuScreen'
import { SOSScreen } from '../screens/SOSScreen'
import { ControlsScreen } from '../screens/ControlsScreen'
import { InsightsScreen } from '../screens/InsightsScreen'
import { ReportScreen } from '../screens/ReportScreen'
import { NotificationsScreen } from '../screens/NotificationsScreen'
import { NoticesScreen } from '../screens/NoticesScreen'
import { LeaveRecordsScreen } from '../screens/LeaveRecordsScreen'
import { CalendarScreen } from '../screens/CalendarScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { AnomaliesScreen } from '../screens/AnomaliesScreen'
import { ChatListScreen } from '../screens/ChatListScreen'
import { ChatDetailScreen } from '../screens/ChatDetailScreen'
import { PredictionsScreen } from '../screens/PredictionsScreen'
import { useTheme } from '../hooks/useTheme'
import type {
  MainTabParamList,
  DashboardStackParamList,
  AcademicsStackParamList,
  MonitorStackParamList,
  TicketsStackParamList,
  MoreStackParamList,
} from '../types/navigation'

const Tab = createBottomTabNavigator<MainTabParamList>()
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>()
const AcademicsStack = createNativeStackNavigator<AcademicsStackParamList>()
const MonitorStack = createNativeStackNavigator<MonitorStackParamList>()
const TicketsStack = createNativeStackNavigator<TicketsStackParamList>()
const MoreStack = createNativeStackNavigator<MoreStackParamList>()

function DashboardStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <DashboardStack.Navigator screenOptions={opts}>
      <DashboardStack.Screen name="Dashboard" component={DashboardScreen} />
    </DashboardStack.Navigator>
  )
}

function AcademicsStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <AcademicsStack.Navigator screenOptions={opts}>
      <AcademicsStack.Screen name="Academics" component={AcademicsScreen} />
    </AcademicsStack.Navigator>
  )
}

function MonitorStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <MonitorStack.Navigator screenOptions={opts}>
      <MonitorStack.Screen name="Monitor" component={MonitorScreen} options={{ title: 'Monitoring' }} />
      <MonitorStack.Screen name="ODTracker" component={ODTrackerScreen} options={{ title: 'OD Tracker' }} />
      <MonitorStack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'CampusOne Expenses' }} />
      <MonitorStack.Screen name="Food" component={FoodScreen} options={{ title: 'Food Monitor' }} />
      <MonitorStack.Screen name="GeofenceAlerts" component={GeofenceAlertsScreen} options={{ title: 'Geofence Alerts' }} />
    </MonitorStack.Navigator>
  )
}

function TicketsStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <TicketsStack.Navigator screenOptions={opts}>
      <TicketsStack.Screen name="TicketsList" component={TicketsListScreen} options={{ title: 'Tickets' }} />
      <TicketsStack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: 'Ticket' }} />
      <TicketsStack.Screen name="CreateTicket" component={CreateTicketScreen} options={{ title: 'New Ticket' }} />
    </TicketsStack.Navigator>
  )
}

function MoreStackScreen() {
  const { c } = useTheme()
  const opts = { headerStyle: { backgroundColor: c.surface }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '700' as const, color: c.primary } }
  return (
    <MoreStack.Navigator screenOptions={opts}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="Fees" component={FeesScreen} />
      <MoreStack.Screen name="SOS" component={SOSScreen} options={{ title: 'SOS Dashboard' }} />
      <MoreStack.Screen name="Controls" component={ControlsScreen} options={{ title: 'Parent Controls' }} />
      <MoreStack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insight Engine' }} />
      <MoreStack.Screen name="Report" component={ReportScreen} options={{ title: 'Weekly Report' }} />
      <MoreStack.Screen name="Notifications" component={NotificationsScreen} />
      <MoreStack.Screen name="Notices" component={NoticesScreen} />
      <MoreStack.Screen name="LeaveRecords" component={LeaveRecordsScreen} options={{ title: 'Leave / OD' }} />
      <MoreStack.Screen name="Calendar" component={CalendarScreen} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
      <MoreStack.Screen name="Anomalies" component={AnomaliesScreen} options={{ title: 'AI Alerts' }} />
      <MoreStack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Faculty Chat' }} />
      <MoreStack.Screen name="ChatDetail" component={ChatDetailScreen} options={({ route }: any) => ({ title: route.params?.facultyName || 'Chat' })} />
      <MoreStack.Screen name="Predictions" component={PredictionsScreen} options={{ title: 'Predictions' }} />
    </MoreStack.Navigator>
  )
}

// ─── Animated Tab Button ─────────────────────────────────────────────────────

const TAB_SPRING = { damping: 18, stiffness: 200, mass: 0.3 }

const TAB_ICONS: Record<string, typeof Home> = {
  Dashboard: Home,
  Academics: BookOpen,
  Monitor: MapPin,
  Tickets: MessageSquare,
  More: Menu,
}

interface AnimatedTabButtonProps {
  label: string
  isFocused: boolean
  onPress: () => void
  onLongPress: () => void
  primaryColor: string
  inactiveColor: string
}

function AnimatedTabButton({
  label,
  isFocused,
  onPress,
  onLongPress,
  primaryColor,
  inactiveColor,
}: AnimatedTabButtonProps) {
  const Icon = TAB_ICONS[label] || Home
  const scale = useSharedValue(1)
  const focused = useSharedValue(isFocused ? 1 : 0)

  React.useEffect(() => {
    focused.value = withSpring(isFocused ? 1 : 0, TAB_SPRING)
    if (isFocused) {
      scale.value = withSpring(1.05, TAB_SPRING)
    } else {
      scale.value = withSpring(1, TAB_SPRING)
    }
  }, [isFocused])

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: focused.value * 0.15,
    transform: [{ scaleX: 0.6 + focused.value * 0.4 }],
  }))

  const color = isFocused ? primaryColor : inactiveColor

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={tabStyles.tabButton}
    >
      {/* Pill indicator behind icon */}
      <Animated.View
        style={[
          tabStyles.pill,
          { backgroundColor: primaryColor },
          pillAnimatedStyle,
        ]}
      />
      <Animated.View style={iconAnimatedStyle}>
        <Icon
          size={21}
          color={color}
          strokeWidth={isFocused ? 2.5 : 1.5}
        />
      </Animated.View>
      <Animated.Text
        style={[
          tabStyles.label,
          {
            color,
            fontWeight: isFocused ? '700' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </TouchableOpacity>
  )
}

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { c, isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const tabBarBg = isDark ? 'rgba(8,6,4,0.92)' : 'rgba(255,255,255,0.88)'
  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'

  return (
    <View
      style={[
        tabStyles.barContainer,
        {
          paddingBottom: Math.max(insets.bottom, 4),
          backgroundColor: tabBarBg,
          borderTopColor: borderColor,
        },
      ]}
    >
      {/* Top accent border */}
      <View style={[tabStyles.topBorder, { backgroundColor: borderColor }]} />

      <View style={tabStyles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key]
          const label = options.title ?? route.name.replace('Tab', '')
          const isFocused = state.index === index

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key })
          }

          return (
            <AnimatedTabButton
              key={route.key}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              primaryColor={c.primary}
              inactiveColor={c.textSecondary}
            />
          )
        })}
      </View>
    </View>
  )
}

// ─── Static Styles ───────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  barContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  topBorder: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 0,
    width: 48,
    height: 32,
    borderRadius: 16,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
})

// ─── Main Tabs ───────────────────────────────────────────────────────────────

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStackScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="AcademicsTab" component={AcademicsStackScreen} options={{ title: 'Academics' }} />
      <Tab.Screen name="MonitorTab" component={MonitorStackScreen} options={{ title: 'Monitor' }} />
      <Tab.Screen name="TicketsTab" component={TicketsStackScreen} options={{ title: 'Tickets' }} />
      <Tab.Screen
        name="MoreTab"
        component={MoreStackScreen}
        options={{ title: 'More' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('MoreTab' as any, { screen: 'MoreMenu' } as any)
          },
        })}
      />
    </Tab.Navigator>
  )
}
