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
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Plus, X, FileText } from 'lucide-react-native'
import { getNotices, createAdminNotice } from '../../api/endpoints'
import { LoadingScreen } from '../../components/LoadingScreen'
import { EmptyState } from '../../components/EmptyState'
import { useTheme } from '../../hooks/useTheme'
import { formatDate } from '../../utils/format'
import type { Notice } from '../../types/api'

const CATEGORIES = ['ACADEMIC', 'ADMINISTRATIVE', 'EVENT', 'GENERAL'] as const

export function AdminNoticesScreen() {
  const { c, spacing } = useTheme()
  const queryClient = useQueryClient()
  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<string>('GENERAL')
  const [requiresAck, setRequiresAck] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notices'],
    queryFn: getNotices,
  })

  const createMutation = useMutation({
    mutationFn: createAdminNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      resetForm()
      setModalVisible(false)
      Alert.alert('Success', 'Notice created successfully')
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create notice')
    },
  })

  const resetForm = () => {
    setTitle('')
    setContent('')
    setCategory('GENERAL')
    setRequiresAck(false)
  }

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation', 'Title and content are required')
      return
    }
    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      category,
      requiresAcknowledgement: requiresAck,
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
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        categoryBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: c.primaryLight + '20',
        },
        categoryText: { fontSize: 11, fontWeight: '700', color: c.primary },
        dateText: { fontSize: 11, color: c.textSecondary },
        noticeTitle: { fontSize: 16, fontWeight: '700', color: c.text },
        noticeContent: {
          fontSize: 13,
          color: c.textSecondary,
          marginTop: spacing.xs,
          lineHeight: 20,
        },
        ackLabel: {
          fontSize: 11,
          color: c.warning,
          fontWeight: '600',
          marginTop: spacing.sm,
        },
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
        switchRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.md,
        },
        switchLabel: { fontSize: 14, color: c.text, fontWeight: '500' },
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

  const renderNotice = ({ item, index }: { item: Notice; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60).springify().damping(18).stiffness(180)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.publishedAt)}</Text>
      </View>
      <Text style={styles.noticeTitle}>{item.title}</Text>
      <Text style={styles.noticeContent} numberOfLines={3}>
        {item.content}
      </Text>
      {item.requiresAcknowledgement && (
        <Text style={styles.ackLabel}>Requires Acknowledgement</Text>
      )}
    </Animated.View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderNotice}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState icon="clipboard" title="No notices" message="Create a new notice to get started." />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Plus size={24} color={c.buttonText} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Notice</Text>
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
                placeholder="Notice title"
                placeholderTextColor={c.textSecondary}
              />

              <Text style={styles.fieldLabel}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Notice content..."
                placeholderTextColor={c.textSecondary}
                multiline
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.pickerRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pickerChip, category === cat && styles.pickerChipActive]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerChipText, category === cat && styles.pickerChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Requires Acknowledgement</Text>
                <Switch
                  value={requiresAck}
                  onValueChange={setRequiresAck}
                  trackColor={{ false: c.border, true: c.primary + '80' }}
                  thumbColor={requiresAck ? c.primary : c.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreate}
                activeOpacity={0.8}
                disabled={createMutation.isPending}
              >
                <Text style={styles.submitText}>
                  {createMutation.isPending ? 'Creating...' : 'Create Notice'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
