import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  FileText,
  AlertTriangle,
  User,
  Calendar,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react-native'
import { useAuth } from '../../auth/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import type { AdminMoreStackParamList } from '../../types/navigation'
import type { LucideIcon } from 'lucide-react-native'

type Nav = NativeStackNavigationProp<AdminMoreStackParamList>

const menuItems: { key: keyof AdminMoreStackParamList; label: string; Icon: LucideIcon; desc: string }[] = [
  { key: 'AdminNotices', label: 'Manage Notices', Icon: FileText, desc: 'Create & manage notices' },
  { key: 'AdminAlerts', label: 'Emergency Alerts', Icon: AlertTriangle, desc: 'Create & manage alerts' },
  { key: 'Notices', label: 'View Notices', Icon: Bell, desc: 'All published notices' },
  { key: 'Calendar', label: 'Calendar', Icon: Calendar, desc: 'Academic calendar' },
  { key: 'Profile', label: 'Profile', Icon: User, desc: 'Your account' },
]

export function AdminMoreMenuScreen() {
  const nav = useNavigation<Nav>()
  const { logout } = useAuth()
  const { c } = useTheme()

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ])
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { padding: 16 },
    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: 14,
      padding: 16, marginBottom: 10,
      borderWidth: 1, borderColor: c.border,
    },
    iconWrap: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: c.background, alignItems: 'center', justifyContent: 'center',
      marginRight: 14,
    },
    label: { fontSize: 15, fontWeight: '600', color: c.text },
    desc: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    logoutCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: 14,
      padding: 16, marginTop: 10,
      borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)',
    },
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {menuItems.map((item, i) => (
        <Animated.View key={item.key} entering={FadeInDown.duration(400).delay(i * 60).springify()}>
          <TouchableOpacity style={styles.card} onPress={() => nav.navigate(item.key)} activeOpacity={0.7}>
            <View style={styles.iconWrap}>
              <item.Icon size={20} color={c.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
            <ChevronRight size={18} color={c.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      ))}
      <Animated.View entering={FadeInDown.duration(400).delay(menuItems.length * 60).springify()}>
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(229,57,53,0.1)' }]}>
            <LogOut size={20} color="#E53935" strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: '#E53935' }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  )
}
