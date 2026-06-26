import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  CreditCard,
  AlertTriangle,
  Settings,
  Brain,
  BarChart3,
  Bell,
  FileText,
  CalendarDays,
  Calendar,
  User,
  ChevronRight,
  LogOut,
  Zap,
  MessageCircle,
  TrendingUp,
} from 'lucide-react-native'
import { getNotifications } from '../api/endpoints'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../hooks/useTheme'
import type { MoreStackParamList } from '../types/navigation'
import type { LucideIcon } from 'lucide-react-native'

type Nav = NativeStackNavigationProp<MoreStackParamList>

const menuItems: { key: keyof MoreStackParamList; label: string; Icon: LucideIcon; desc: string }[] = [
  { key: 'Anomalies', label: 'AI Alerts', Icon: Zap, desc: 'AI-detected anomalies & alerts' },
  { key: 'ChatList', label: 'Faculty Chat', Icon: MessageCircle, desc: 'Chat with faculty members' },
  { key: 'Predictions', label: 'Predictions', Icon: TrendingUp, desc: 'AI forecasts & predictions' },
  { key: 'Fees', label: 'Fees', Icon: CreditCard, desc: 'Fee records & payments' },
  { key: 'SOS', label: 'Emergency SOS', Icon: AlertTriangle, desc: 'Trigger emergency alert' },
  { key: 'Controls', label: 'Parent Controls', Icon: Settings, desc: 'Spending limits & alerts' },
  { key: 'Insights', label: 'Insights', Icon: Brain, desc: 'Trust score & analysis' },
  { key: 'Report', label: 'Weekly Report', Icon: BarChart3, desc: 'Weekly performance summary' },
  { key: 'Notifications', label: 'Notifications', Icon: Bell, desc: 'View all notifications' },
  { key: 'Notices', label: 'Notices', Icon: FileText, desc: 'College notices & announcements' },
  { key: 'LeaveRecords', label: 'Leave / OD', Icon: CalendarDays, desc: 'Leave and OD records' },
  { key: 'Calendar', label: 'Calendar', Icon: Calendar, desc: 'Upcoming events' },
  { key: 'Profile', label: 'Profile', Icon: User, desc: 'Your profile & settings' },
]

type SectionKey = keyof MoreStackParamList

interface Section {
  title: string
  keys: SectionKey[]
}

const sections: Section[] = [
  { title: 'AI & Insights', keys: ['Anomalies', 'Predictions', 'Insights', 'Report'] },
  { title: 'Communication', keys: ['ChatList', 'Notifications', 'Notices'] },
  { title: 'Finance', keys: ['Fees'] },
  { title: 'Safety', keys: ['SOS', 'Controls'] },
  { title: 'Records', keys: ['LeaveRecords', 'Calendar'] },
  { title: 'Account', keys: ['Profile'] },
]

const menuMap = new Map(menuItems.map((item) => [item.key, item]))

// Pre-compute stagger indices for each item across all sections
const itemDelays: Map<string, number> = new Map()
let _idx = 0
for (const section of sections) {
  for (const key of section.keys) {
    itemDelays.set(key, _idx * 40)
    _idx++
  }
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export function MoreMenuScreen() {
  const navigation = useNavigation<Nav>()
  const { c, spacing } = useTheme()
  const { logout, user } = useAuth()

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  })

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ])
  }

  const ds = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: c.background },
      content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl + spacing.lg },
      // Header
      headerWrap: {
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.xs,
        marginBottom: spacing.sm,
      },
      greeting: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: c.textSecondary,
        letterSpacing: 0.3,
      },
      userName: {
        fontSize: 26,
        fontWeight: '700' as const,
        color: c.text,
        marginTop: 2,
      },
      // Section
      sectionHeader: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: c.textMuted,
        letterSpacing: 1.2,
        textTransform: 'uppercase' as const,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
      },
      // Menu item
      menuItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: c.surface,
        borderRadius: 14,
        padding: spacing.md,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: c.cardBorder,
        marginBottom: spacing.sm,
      },
      iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: c.inputBg,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      menuLabel: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: c.text,
      },
      menuDesc: {
        fontSize: 12,
        color: c.textMuted,
        marginTop: 1,
        lineHeight: 16,
      },
      chevron: {
        marginLeft: 'auto' as const,
      },
      // Badge
      badge: {
        backgroundColor: c.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingHorizontal: 6,
      },
      badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700' as const,
      },
      // Logout
      logoutBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: spacing.sm,
        marginTop: spacing.lg,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: c.error,
        backgroundColor: c.dangerBg,
      },
      logoutText: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: c.error,
      },
    }),
    [c, spacing]
  )

  return (
    <Animated.ScrollView
      style={ds.container}
      contentContainerStyle={ds.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(350)} style={ds.headerWrap}>
        <Text style={ds.greeting}>Welcome back,</Text>
        <Text style={ds.userName}>{user?.name ?? 'Parent'}</Text>
      </Animated.View>

      {/* Sections */}
      {sections.map((section) => {
        const sectionItems = section.keys
          .map((key) => menuMap.get(key))
          .filter(Boolean) as typeof menuItems

        return (
          <View key={section.title}>
            <Animated.Text
              entering={FadeInDown.duration(300).delay(100)}
              style={ds.sectionHeader}
            >
              {section.title}
            </Animated.Text>

            {sectionItems.map((item) => (
              <AnimatedTouchable
                key={item.key}
                entering={FadeInDown.delay(itemDelays.get(item.key) ?? 0).duration(350)}
                style={ds.menuItem}
                onPress={() => navigation.navigate(item.key as any)}
                activeOpacity={0.7}
              >
                <View style={ds.iconContainer}>
                  <item.Icon size={20} color={c.primary} />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={ds.menuLabel}>{item.label}</Text>
                  <Text style={ds.menuDesc}>{item.desc}</Text>
                </View>
                {item.key === 'Notifications' && unreadCount > 0 && (
                  <View style={ds.badge}>
                    <Text style={ds.badgeText}>{unreadCount}</Text>
                  </View>
                )}
                <ChevronRight size={18} color={c.textDarkest} style={ds.chevron} />
              </AnimatedTouchable>
            ))}
          </View>
        )
      })}

      {/* Logout */}
      <AnimatedTouchable
        entering={FadeInDown.delay(550).duration(350)}
        style={ds.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <LogOut size={18} color={c.error} />
        <Text style={ds.logoutText}>Sign Out</Text>
      </AnimatedTouchable>
    </Animated.ScrollView>
  )
}

const styles = StyleSheet.create({
  menuInfo: { flex: 1 },
})
