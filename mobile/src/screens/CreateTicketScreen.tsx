import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { getProfile, createTicket } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { useTheme } from '../hooks/useTheme'

const CATEGORIES = ['ATTENDANCE', 'MARKS', 'FEE', 'LEAVE', 'GENERAL', 'COMPLAINT', 'OTHER']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export function CreateTicketScreen() {
  const { c, spacing } = useTheme()
  const navigation = useNavigation()
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const [studentId, setStudentId] = useState('')
  const [category, setCategory] = useState('GENERAL')
  const [priority, setPriority] = useState('MEDIUM')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      navigation.goBack()
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  })

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        content: { padding: spacing.md, gap: spacing.md },
        label: { fontSize: 14, fontWeight: '600', color: c.text },
        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        },
        chipActive: { backgroundColor: c.primary, borderColor: c.primary },
        chipText: { fontSize: 13, fontWeight: '500', color: c.text },
        chipTextActive: { color: '#FFF' },
        input: {
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          fontSize: 15,
          color: c.text,
        },
        textarea: { height: 120 },
        button: {
          backgroundColor: c.primary,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: spacing.sm,
        },
        buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
      }),
    [c, spacing],
  )

  if (isLoading) return <LoadingScreen />

  const students = profile?.students || []
  const selectedStudent = studentId || students[0]?.id || ''

  const handleSubmit = () => {
    if (!subject.trim() || subject.trim().length < 5) {
      Alert.alert('Error', 'Subject must be at least 5 characters')
      return
    }
    if (!description.trim() || description.trim().length < 20) {
      Alert.alert('Error', 'Description must be at least 20 characters')
      return
    }
    mutation.mutate({
      studentId: selectedStudent,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)}>
        <Text style={styles.label}>Student</Text>
        <View style={styles.chipRow}>
          {students.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, (selectedStudent === s.id) && styles.chipActive]}
              onPress={() => setStudentId(s.id)}
            >
              <Text style={[styles.chipText, (selectedStudent === s.id) && styles.chipTextActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(120).springify().damping(18).stiffness(180)}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.chipRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, priority === p && styles.chipActive]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(180).springify().damping(18).stiffness(180)}>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Brief summary of the issue"
          placeholderTextColor={c.textTertiary}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(240).springify().damping(18).stiffness(180)}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail (min 20 chars)"
          placeholderTextColor={c.textTertiary}
          multiline
          textAlignVertical="top"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(300).springify().damping(18).stiffness(180)}>
        <TouchableOpacity
          style={[styles.button, mutation.isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={mutation.isPending}
        >
          <Text style={styles.buttonText}>{mutation.isPending ? 'Creating...' : 'Create Ticket'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  )
}
