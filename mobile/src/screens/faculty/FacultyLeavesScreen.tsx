import React, { useState, useMemo, useCallback } from 'react'
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
  Platform,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Check, X, Calendar, User, BookOpen } from 'lucide-react-native'
import { getFacultyLeaves, updateFacultyLeave } from '../../api/endpoints'
import { LoadingScreen } from '../../components/LoadingScreen'
import { EmptyState } from '../../components/EmptyState'
import { useTheme } from '../../hooks/useTheme'
import { formatDate } from '../../utils/format'

export function FacultyLeavesScreen() {
  const { c, spacing, isDark } = useTheme()
  const queryClient = useQueryClient()

  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null)
  const [remarks, setRemarks] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['faculty-leaves'],
    queryFn: getFacultyLeaves,
  })

  const mutation = useMutation({
    mutationFn: updateFacultyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-leaves'] })
    },
  })

  const pendingLeaves = useMemo(
    () => data?.leaves?.filter((l) => l.status === 'PENDING') ?? [],
    [data],
  )

  const handleApprove = useCallback(
    (leaveId: string) => {
      Alert.alert('Approve Leave', 'Are you sure you want to approve this leave request?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => mutation.mutate({ leaveId, status: 'APPROVED' }),
        },
      ])
    },
    [mutation],
  )

  const handleRejectPress = useCallback((leaveId: string) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Reject Leave',
        'Enter optional remarks for rejection:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: (text?: string) =>
              mutation.mutate({ leaveId, status: 'REJECTED', remarks: text || undefined }),
          },
        ],
        'plain-text',
        '',
      )
    } else {
      setSelectedLeaveId(leaveId)
      setRemarks('')
      setRejectModalVisible(true)
    }
  }, [mutation])

  const confirmReject = useCallback(() => {
    if (selectedLeaveId) {
      mutation.mutate({
        leaveId: selectedLeaveId,
        status: 'REJECTED',
        remarks: remarks.trim() || undefined,
      })
    }
    setRejectModalVisible(false)
    setSelectedLeaveId(null)
    setRemarks('')
  }, [selectedLeaveId, remarks, mutation])

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        list: { padding: spacing.md, gap: spacing.sm },
        card: {
          backgroundColor: c.surface,
          borderRadius: 12,
          padding: spacing.md,
        },
        studentName: { fontSize: 16, fontWeight: '700', color: c.text },
        registerNo: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        deptBadge: {
          backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.1)',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          alignSelf: 'flex-start',
        },
        deptText: { fontSize: 11, fontWeight: '600', color: c.primary },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: c.border,
          marginVertical: spacing.sm,
        },
        infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
        infoLabel: { fontSize: 12, color: c.textSecondary },
        infoValue: { fontSize: 13, color: c.text, fontWeight: '500' },
        reason: { fontSize: 13, color: c.text, marginTop: spacing.sm, lineHeight: 18 },
        reasonLabel: { fontSize: 12, color: c.textSecondary, marginTop: spacing.sm },
        actions: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginTop: spacing.md,
        },
        btn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 10,
          borderRadius: 10,
        },
        approveBtn: {
          backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
          borderWidth: 1,
          borderColor: 'rgba(34,197,94,0.3)',
        },
        rejectBtn: {
          backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
          borderWidth: 1,
          borderColor: 'rgba(239,68,68,0.3)',
        },
        approveTxt: { fontSize: 14, fontWeight: '600', color: '#22c55e' },
        rejectTxt: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
        // Modal styles
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        },
        modalContent: {
          backgroundColor: c.surface,
          borderRadius: 16,
          padding: spacing.lg,
          width: '100%',
          maxWidth: 400,
        },
        modalTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: spacing.sm },
        modalDesc: { fontSize: 14, color: c.textSecondary, marginBottom: spacing.md },
        modalInput: {
          backgroundColor: c.background,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: c.border,
          padding: spacing.sm,
          fontSize: 14,
          color: c.text,
          minHeight: 80,
          textAlignVertical: 'top',
        },
        modalActions: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginTop: spacing.md,
        },
        modalCancel: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: 'center',
          backgroundColor: c.background,
          borderWidth: 1,
          borderColor: c.border,
        },
        modalCancelTxt: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
        modalReject: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: 'center',
          backgroundColor: '#ef4444',
        },
        modalRejectTxt: { fontSize: 14, fontWeight: '600', color: '#fff' },
      }),
    [c, spacing, isDark],
  )

  if (isLoading) return <LoadingScreen />

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingLeaves}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState icon="calendar" title="No pending leaves" message="All leave requests have been handled" />
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(400).delay(index * 60).springify().damping(18).stiffness(180)}
            style={styles.card}
          >
            {/* Student info */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{item.student.name}</Text>
                <Text style={styles.registerNo}>{item.student.registerNumber}</Text>
              </View>
              <View style={styles.deptBadge}>
                <Text style={styles.deptText}>{item.student.department.code}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Leave details */}
            <View style={styles.infoRow}>
              <BookOpen size={14} color={c.textSecondary} />
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{item.type.replace(/_/g, ' ')}</Text>
            </View>

            <View style={styles.infoRow}>
              <Calendar size={14} color={c.textSecondary} />
              <Text style={styles.infoLabel}>Dates:</Text>
              <Text style={styles.infoValue}>
                {formatDate(item.startDate)} — {formatDate(item.endDate)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <User size={14} color={c.textSecondary} />
              <Text style={styles.infoLabel}>Sem {item.student.semester}</Text>
              <Text style={styles.infoValue}>· Section {item.student.section}</Text>
            </View>

            <Text style={styles.reasonLabel}>Reason</Text>
            <Text style={styles.reason}>{item.reason}</Text>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.approveBtn]}
                onPress={() => handleApprove(item.id)}
                activeOpacity={0.7}
                disabled={mutation.isPending}
              >
                <Check size={16} color="#22c55e" />
                <Text style={styles.approveTxt}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.rejectBtn]}
                onPress={() => handleRejectPress(item.id)}
                activeOpacity={0.7}
                disabled={mutation.isPending}
              >
                <X size={16} color="#ef4444" />
                <Text style={styles.rejectTxt}>Reject</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      />

      {/* Reject remarks modal (Android) */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Leave</Text>
            <Text style={styles.modalDesc}>Enter optional remarks for rejection:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Remarks (optional)"
              placeholderTextColor={c.textTertiary}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalReject} onPress={confirmReject}>
                <Text style={styles.modalRejectTxt}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
