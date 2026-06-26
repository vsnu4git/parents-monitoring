import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert,
} from 'react-native'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Zap, TrendingDown, DollarSign, UtensilsCrossed, MapPin,
  BookOpen, Calendar, AlertTriangle, X, Eye,
} from 'lucide-react-native'
import { getAnomalies, dismissAnomaly, markAnomalyRead } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import type { AnomalyItem } from '../types/api'
import type { LucideIcon } from 'lucide-react-native'

const TYPE_ICONS: Record<string, LucideIcon> = {
  attendance: TrendingDown,
  spending: DollarSign,
  meals: UtensilsCrossed,
  location: MapPin,
  grades: BookOpen,
  absences: Calendar,
}

function getSeverityColor(severity: string, c: any) {
  switch (severity) {
    case 'critical': return { bg: c.dangerBg, border: c.dangerBorder, text: c.error, pill: '#E53935' }
    case 'high': return { bg: c.errorLight, border: c.dangerBorder, text: '#EA580C', pill: '#EA580C' }
    case 'medium': return { bg: c.warningLight, border: c.warningBorder, text: c.warning, pill: c.warning }
    case 'low': return { bg: c.surfaceVariant, border: c.borderLight, text: c.textTertiary, pill: c.textTertiary }
    default: return { bg: c.surfaceVariant, border: c.borderLight, text: c.textMuted, pill: c.textMuted }
  }
}

function AnomalyCard({ item, c, spacing, onDismiss, onMarkRead }: {
  item: AnomalyItem; c: any; spacing: any; onDismiss: (id: string) => void; onMarkRead: (id: string) => void
}) {
  const sev = getSeverityColor(item.severity, c)
  const Icon = TYPE_ICONS[item.type] || AlertTriangle
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(item.detectedAt).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }, [item.detectedAt])

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()}>
      <View style={{
        backgroundColor: sev.bg, borderWidth: 1, borderColor: sev.border,
        borderRadius: 14, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm,
        opacity: item.isRead ? 0.7 : 1,
      }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: sev.text + '15', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={sev.text} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View style={{
                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
                    backgroundColor: sev.text + '20',
                  }}>
                    <Text style={{ fontSize: 8, fontWeight: '700', color: sev.text, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {item.severity}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 9, color: c.textMuted }}>{timeAgo}</Text>
                  {!item.isRead && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary }} />
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 4, lineHeight: 18 }}>
                  {item.description}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {!item.isRead && (
                <TouchableOpacity
                  onPress={() => onMarkRead(item.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
                  }}
                >
                  <Eye size={12} color={c.textSecondary} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: c.textSecondary }}>Mark Read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => onDismiss(item.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                  backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
                }}
              >
                <X size={12} color={c.textMuted} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

export function AnomaliesScreen() {
  const { c, spacing } = useTheme()
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['anomalies'],
    queryFn: getAnomalies,
  })

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false) }

  const dismissMutation = useMutation({
    mutationFn: dismissAnomaly,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['anomalies'] }),
  })

  const readMutation = useMutation({
    mutationFn: markAnomalyRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['anomalies'] }),
  })

  const handleDismiss = useCallback((id: string) => {
    Alert.alert('Dismiss Alert', 'Are you sure you want to dismiss this alert?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Dismiss', style: 'destructive', onPress: () => dismissMutation.mutate(id) },
    ])
  }, [dismissMutation])

  const handleMarkRead = useCallback((id: string) => { readMutation.mutate(id) }, [readMutation])


  if (isLoading && !data) return <LoadingScreen />
  if (!data || data.anomalies.length === 0) return <EmptyState icon="shield" title="No anomalies detected" message="Everything looks normal" />

  const { anomalies, summary } = data

  const grouped: Record<string, AnomalyItem[]> = { critical: [], high: [], medium: [], low: [] }
  anomalies.filter(a => !a.isDismissed).forEach(a => {
    if (grouped[a.severity]) grouped[a.severity].push(a)
    else grouped.low.push(a)
  })

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
    >
      {/* Header */}
      <Animated.View entering={FadeIn.duration(500)}>
        <LinearGradient
          colors={[c.headerGradientStart, c.headerGradientEnd]}
          style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Zap size={20} color={c.primary} strokeWidth={2} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: c.textTertiary, letterSpacing: 3, textTransform: 'uppercase' }}>
              AI ALERTS
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: c.text }}>
            Anomaly Detection
          </Text>
          <Text style={{ fontSize: 12, color: c.textDark, marginTop: 2 }}>
            AI-detected behavioral anomalies
          </Text>

          {/* Summary pills */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {summary.critical > 0 && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: c.dangerBg, borderColor: c.dangerBorder }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: c.error }}>{summary.critical} critical</Text>
              </View>
            )}
            {summary.high > 0 && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: c.errorLight, borderColor: c.dangerBorder }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#EA580C' }}>{summary.high} high</Text>
              </View>
            )}
            {summary.medium > 0 && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: c.warningLight, borderColor: c.warningBorder }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: c.warning }}>{summary.medium} medium</Text>
              </View>
            )}
            {summary.low > 0 && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: c.surfaceVariant, borderColor: c.borderLight }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: c.textTertiary }}>{summary.low} low</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Critical */}
      {grouped.critical.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 20, color: c.error }}>
            Critical
          </Text>
          {grouped.critical.map(a => (
            <AnomalyCard key={a.id} item={a} c={c} spacing={spacing} onDismiss={handleDismiss} onMarkRead={handleMarkRead} />
          ))}
        </View>
      )}

      {/* High */}
      {grouped.high.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 20, color: '#EA580C' }}>
            High Priority
          </Text>
          {grouped.high.map(a => (
            <AnomalyCard key={a.id} item={a} c={c} spacing={spacing} onDismiss={handleDismiss} onMarkRead={handleMarkRead} />
          ))}
        </View>
      )}

      {/* Medium */}
      {grouped.medium.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 20, color: c.warning }}>
            Medium
          </Text>
          {grouped.medium.map(a => (
            <AnomalyCard key={a.id} item={a} c={c} spacing={spacing} onDismiss={handleDismiss} onMarkRead={handleMarkRead} />
          ))}
        </View>
      )}

      {/* Low */}
      {grouped.low.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 20, color: c.textTertiary }}>
            Low
          </Text>
          {grouped.low.map(a => (
            <AnomalyCard key={a.id} item={a} c={c} spacing={spacing} onDismiss={handleDismiss} onMarkRead={handleMarkRead} />
          ))}
        </View>
      )}
    </ScrollView>
  )
}
