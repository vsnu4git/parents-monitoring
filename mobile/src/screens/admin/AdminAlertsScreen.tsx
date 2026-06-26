import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Plus, X, AlertTriangle, Info, AlertOctagon } from 'lucide-react-native'
import { getAlerts, createAdminAlert } from '../../api/endpoints'
import { LoadingScreen } from '../../components/LoadingScreen'
import { EmptyState } from '../../components/EmptyState'
import { useTheme } from '../../hooks/useTheme'
import { formatDate } from '../../utils/format'
import type { EmergencyAlert } from '../../types/api'

const SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'] as const
const SCOPES = ['INSTITUTION', 'DEPARTMENT'] as const

function getSeverityColor(severity: string, c: any) {
  switch (severity) {
    case 'INFO':
      return c.info
    case 'WARNING':
      return c.warning
    case 'CRITICAL':
      return c.error
    default:
      return c.textSecondary
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'INFO':
      return Info
    case 'WARNING':
      return AlertTriangle
    case 'CRITICAL':
      return AlertOctagon
    default:
      return Info
  }
}

export function AdminAlertsScreen() {
  const { c, spacing } = useTheme()
  const queryClient = useQueryClient()
  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<string>('INFO')
  const [targetScope, setTargetScope] = useState<string>('INSTITUTION')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  })

  const createMutation = useMutation({
    mutationFn: createAdminAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      resetForm()
      setModalVisible(false)
      Alert.alert('Success', 'Alert created successfully')
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create alert')
    },
  })

  const resetForm = () => {
    setTitle('')
    setMessage('')
    setSeverity('INFO')
    setTargetScope('INSTITUTION')
  }

  const handleCreate = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Validation', 'Title and message are required')
      return
    }
    createMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      severity,
      targetScope,
    })
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        list: { padding: spacing.md, gap: spacing.sm },
        card: {
          backgroundColor: c.surface,
          borderRadius: 14,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: c.border,
        },
        cardTopRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: spacing.sm,
        },
        iconBox: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cardTitleCol: { flex: 1 },
        alertTitle: { fontSize: 15, fontWeight: '700', color: c.text },
        alertDate: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
        severityBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
        },
        severityText: { fontSize: 11, fontWeight: '700' },
        alertMessage: {
          fontSize: 13,
          color: c.textSecondary,
          lineHeight: 20,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: spacing.sm,
        },
        scopeBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: c.primaryLight + '20',
        },
        scopeText: { fontSize: 10, fontWeight: '600', color: c.primary },
        activeBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
        },
        activeText: { fontSize: 10, fontWeight: '600' },
        fab: {
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.primary,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        },
        // Modal
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
        },
        modalContainer: {
          backgroundColor: c.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: spacing.lg,
          maxHeight: '85%',
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg,
        },
        modalTitle: { fontSize: 18, fontWeight: '700', color: c.text },
        closeBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: c.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        fieldLabel: {
          fontSize: 12,
          fontWeight: '600',
          color: c.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 6,
          marginTop: spacing.md,
        },
        input: {
          backgroundColor: c.background,
          borderRadius: 10,
          padding: 12,
          fontSize: 15,
          color: c.text,
          borderWidth: 1,
          borderColor: c.border,
        },
        textArea: {
          minHeight: 100,
          textAlignVertical: 'top',
        },
        pickerRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        pickerChip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: c.background,
          borderWidth: 1,
          borderColor: c.border,
        },
        pickerChipActive: {
          backgroundColor: c.primary,
          borderColor: c.primary,
        },
        pickerChipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
        pickerChipTextActive: { color: c.buttonText },
        submitBtn: {
          backgroundColor: c.primary,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: spacing.lg,
        },
        submitText: { color: c.buttonText, fontWeight: '700', fontSize: 15 },
      }),
    [c, spacing],
  )

  if (isLoading) return <LoadingScreen />

  const renderAlert = ({ item, index }: { item: EmergencyAlert; index: number }) => {
    const sevColor = getSeverityColor(item.severity, c)
    const SevIcon = getSeverityIcon(item.severity)

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 60).springify().damping(18).stiffness(180)}
        style={styles.card}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.iconBox, { backgroundColor: sevColor + '15' }]}>
            <SevIcon size={18} color={sevColor} />
          </View>
          <View style={styles.cardTitleCol}>
            <Text style={styles.alertTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.alertDate}>{formatDate(item.publishedAt)}</Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: sevColor + '18' }]}>
            <Text style={[styles.severityText, { color: sevColor }]}>{item.severity}</Text>
          </View>
        </View>

        <Text style={styles.alertMessage} numberOfLines={3}>
          {item.message}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.scopeBadge}>
            <Text style={styles.scopeText}>{item.targetScope}</Text>
          </View>
          {item.targetDept ? (
            <View style={styles.scopeBadge}>
              <Text style={styles.scopeText}>{item.targetDept}</Text>
            </View>
          ) : null}
          <View
            style={[
              styles.activeBadge,
              { backgroundColor: item.isActive ? c.success + '18' : c.error + '18' },
            ]}
          >
            <Text style={[styles.activeText, { color: item.isActive ? c.success : c.error }]}>
              {item.isActive ? 'ACTIVE' : 'EXPIRED'}
            </Text>
          </View>
        </View>
      </Animated.View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState icon="shield" title="No alerts" message="Create a new emergency alert to get started." />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Plus size={24} color={c.buttonText} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Alert</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <X size={18} color={c.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { marginTop: 0 }]}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Alert title"
                placeholderTextColor={c.textSecondary}
              />

              <Text style={styles.fieldLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Alert message..."
                placeholderTextColor={c.textSecondary}
                multiline
              />

              <Text style={styles.fieldLabel}>Severity</Text>
              <View style={styles.pickerRow}>
                {SEVERITIES.map((sev) => {
                  const sevColor = getSeverityColor(sev, c)
                  return (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.pickerChip,
                        severity === sev && { backgroundColor: sevColor, borderColor: sevColor },
                      ]}
                      onPress={() => setSeverity(sev)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerChipText,
                          severity === sev && { color: '#FFF' },
                        ]}
                      >
                        {sev}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={styles.fieldLabel}>Target Scope</Text>
              <View style={styles.pickerRow}>
                {SCOPES.map((scope) => (
                  <TouchableOpacity
                    key={scope}
                    style={[styles.pickerChip, targetScope === scope && styles.pickerChipActive]}
                    onPress={() => setTargetScope(scope)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerChipText, targetScope === scope && styles.pickerChipTextActive]}>
                      {scope}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreate}
                activeOpacity={0.8}
                disabled={createMutation.isPending}
              >
                <Text style={styles.submitText}>
                  {createMutation.isPending ? 'Creating...' : 'Create Alert'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
