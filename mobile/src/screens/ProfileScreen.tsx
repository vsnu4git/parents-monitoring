import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Sun, Moon, Mail, Phone, Building, LogOut } from 'lucide-react-native'
import { getProfile } from '../api/endpoints'
import { useAuth } from '../auth/AuthContext'
import { Card } from '../components/Card'
import { LoadingScreen } from '../components/LoadingScreen'
import { useTheme } from '../hooks/useTheme'
import Animated, { FadeInDown } from 'react-native-reanimated'

export function ProfileScreen() {
  const { user, logout } = useAuth()
  const { c, spacing, toggle, isDark } = useTheme()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ])
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        content: { padding: spacing.md, gap: spacing.md, alignItems: 'stretch' },
        themeToggle: {
          alignSelf: 'flex-end',
          padding: spacing.sm,
          borderRadius: 12,
          backgroundColor: c.surface,
        },
        avatar: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: c.primary,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
        },
        avatarText: { fontSize: 32, fontWeight: '700', color: '#FFF' },
        infoRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: c.divider,
        },
        infoLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        infoLabel: { fontSize: 13, color: c.textSecondary },
        infoValue: { fontSize: 14, fontWeight: '500', color: c.text },
        studentCard: {
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: c.divider,
        },
        studentName: { fontSize: 15, fontWeight: '600', color: c.text },
        studentInfo: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        logoutButton: {
          backgroundColor: c.error,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: spacing.md,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.sm,
        },
        logoutText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
      }),
    [c, spacing],
  )

  const iconForLabel = (label: string) => {
    switch (label) {
      case 'Email':
        return <Mail size={16} color={c.textSecondary} />
      case 'Phone':
        return <Phone size={16} color={c.textSecondary} />
      case 'Occupation':
        return <Building size={16} color={c.textSecondary} />
      default:
        return null
    }
  }

  if (isLoading) return <LoadingScreen />

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)}>
        <TouchableOpacity style={styles.themeToggle} onPress={toggle}>
          {isDark ? (
            <Sun size={22} color={c.text} />
          ) : (
            <Moon size={22} color={c.text} />
          )}
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'P'}
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)}>
      <Card title="Personal Information">
        <InfoRow label="Name" value={user?.name || ''} icon={null} styles={styles} />
        <InfoRow label="Email" value={user?.email || ''} icon={iconForLabel('Email')} styles={styles} />
        <InfoRow label="Phone" value={profile?.user?.phone || 'Not set'} icon={iconForLabel('Phone')} styles={styles} />
        <InfoRow label="Relation" value={profile?.relation || ''} icon={null} styles={styles} />
        <InfoRow label="Occupation" value={profile?.occupation || 'Not set'} icon={iconForLabel('Occupation')} styles={styles} />
      </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(120).springify().damping(18).stiffness(180)}>
      <Card title="Linked Students">
        {profile?.students.map((student) => (
          <View key={student.id} style={styles.studentCard}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentInfo}>
              {student.registerNumber} | {student.department.name}
            </Text>
            <Text style={styles.studentInfo}>
              Year {student.year}, Semester {student.semester}, Section {student.section}
            </Text>
          </View>
        ))}
      </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(180).springify().damping(18).stiffness(180)}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#FFF" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  )
}

function InfoRow({
  label,
  value,
  icon,
  styles,
}: {
  label: string
  value: string
  icon: React.ReactNode
  styles: any
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        {icon}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}
