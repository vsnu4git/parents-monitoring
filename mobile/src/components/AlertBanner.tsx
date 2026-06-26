import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react-native'
import { useTheme } from '../hooks/useTheme'
import type { EmergencyAlert } from '../types/api'

interface AlertBannerProps {
  alerts: EmergencyAlert[]
  onAcknowledge?: (id: string) => void
}

export function AlertBanner({ alerts, onAcknowledge }: AlertBannerProps) {
  const { c, spacing } = useTheme()

  const dynamicStyles = useMemo(
    () => ({
      container: { gap: spacing.sm },
      alert: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: spacing.md,
        borderRadius: 12,
        backgroundColor: c.infoLight,
        borderWidth: 1,
        borderColor: c.border,
      },
      critical: {
        backgroundColor: c.errorLight,
        borderColor: c.dangerBorder,
      },
      warning: {
        backgroundColor: c.warningLight,
        borderColor: c.warningBorder,
      },
      title: { fontSize: 14, fontWeight: '700' as const, color: c.text },
      message: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
      ackButton: {
        backgroundColor: c.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: spacing.sm,
      },
      ackText: { color: c.buttonText, fontWeight: '600' as const, fontSize: 12 },
    }),
    [c, spacing]
  )

  if (alerts.length === 0) return null

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle size={20} color={c.error} />
      case 'WARNING':
        return <AlertTriangle size={20} color={c.warning} />
      default:
        return <Info size={20} color={c.info} />
    }
  }

  return (
    <View style={dynamicStyles.container}>
      {alerts.map((alert) => (
        <View
          key={alert.id}
          style={[
            dynamicStyles.alert,
            alert.severity === 'CRITICAL' && dynamicStyles.critical,
            alert.severity === 'WARNING' && dynamicStyles.warning,
          ]}
        >
          <View style={styles.iconContainer}>{getIcon(alert.severity)}</View>
          <View style={styles.content}>
            <Text style={dynamicStyles.title}>{alert.title}</Text>
            <Text style={dynamicStyles.message} numberOfLines={2}>
              {alert.message}
            </Text>
          </View>
          {onAcknowledge && !alert.acknowledged && (
            <TouchableOpacity
              style={dynamicStyles.ackButton}
              onPress={() => onAcknowledge(alert.id)}
            >
              <Text style={dynamicStyles.ackText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  iconContainer: { marginRight: 8 },
  content: { flex: 1 },
})
