import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, FlatList,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle, Plus, ChevronRight, X, User,
} from 'lucide-react-native'
import { getConversations, getFacultyList, createConversation, getDashboard } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../auth/AuthContext'
import type { MoreStackParamList } from '../types/navigation'
import type { ConversationPreview, FacultyInfo } from '../types/api'

type Nav = NativeStackNavigationProp<MoreStackParamList>

function InitialsAvatar({ name, size, bg, textColor }: { name: string; size: number; bg: string; textColor: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: textColor }}>{initials}</Text>
    </View>
  )
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (days === 1) return 'Yesterday'
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ChatListScreen() {
  const navigation = useNavigation<Nav>()
  const { c, spacing } = useTheme()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [showFacultyPicker, setShowFacultyPicker] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const studentId = dashboard?.students?.[0]?.id || ''

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })

  const { data: facultyList } = useQuery({
    queryKey: ['faculty-list', studentId],
    queryFn: () => getFacultyList(studentId),
    enabled: showFacultyPicker && !!studentId,
  })

  const createMutation = useMutation({
    mutationFn: ({ facultyId, studentId }: { facultyId: string; studentId: string }) =>
      createConversation(facultyId, studentId),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setShowFacultyPicker(false)
      navigation.navigate('ChatDetail', { conversationId: conv.id, facultyName: conv.facultyName })
    },
    onError: (err: any) => Alert.alert('Error', err.message || 'Could not start conversation'),
  })

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false) }

  const handleSelectFaculty = useCallback((faculty: FacultyInfo) => {
    // For simplicity, we use the first student associated with the parent
    // The backend will resolve the correct student
    createMutation.mutate({ facultyId: faculty.id, studentId })
  }, [createMutation])

  if (isLoading && !conversations) return <LoadingScreen />

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)}>
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <MessageCircle size={20} color={c.primary} strokeWidth={2} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: c.textTertiary, letterSpacing: 3, textTransform: 'uppercase' }}>
                FACULTY CHAT
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: c.textDark, marginTop: 2 }}>
              Communicate with your child's faculty
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)}>
        {(!conversations || conversations.length === 0) ? (
          <EmptyState icon="message" title="No conversations yet" message="Tap + to start a conversation with faculty" />
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              onPress={() => navigation.navigate('ChatDetail', { conversationId: conv.id, facultyName: conv.facultyName })}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingHorizontal: 20, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: c.borderLight,
                backgroundColor: conv.unreadCount > 0 ? c.cardGlow : 'transparent',
              }}
            >
              <InitialsAvatar name={conv.facultyName} size={48} bg={c.primary + '20'} textColor={c.primary} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: conv.unreadCount > 0 ? '700' : '600', color: c.text }}>{conv.facultyName}</Text>
                  <Text style={{ fontSize: 11, color: c.textMuted }}>{formatTime(conv.lastMessageAt)}</Text>
                </View>
                <Text style={{ fontSize: 11, color: c.textTertiary, marginTop: 1 }}>{conv.facultyDepartment}</Text>
                {conv.lastMessage && (
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 13, color: conv.unreadCount > 0 ? c.text : c.textSecondary, marginTop: 4 }}
                  >
                    {conv.lastMessage}
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {conv.unreadCount > 0 && (
                  <View style={{
                    backgroundColor: c.primary, borderRadius: 10, minWidth: 20, height: 20,
                    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: c.buttonText }}>{conv.unreadCount}</Text>
                  </View>
                )}
                <ChevronRight size={16} color={c.textDarkest} />
              </View>
            </TouchableOpacity>
          ))
        )}
        </Animated.View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowFacultyPicker(true)}
        style={{
          position: 'absolute', bottom: 24, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6,
          elevation: 8,
        }}
      >
        <Plus size={24} color={c.buttonText} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Faculty Picker Modal */}
      <Modal visible={showFacultyPicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
            maxHeight: '70%', paddingBottom: 40,
          }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 20, borderBottomWidth: 1, borderBottomColor: c.borderLight,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>Select Faculty</Text>
              <TouchableOpacity onPress={() => setShowFacultyPicker(false)}>
                <X size={24} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            {!facultyList ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: c.textMuted }}>Loading faculty...</Text>
              </View>
            ) : facultyList.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: c.textMuted }}>No faculty available</Text>
              </View>
            ) : (
              <FlatList
                data={facultyList}
                keyExtractor={(f) => f.id}
                renderItem={({ item: faculty }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectFaculty(faculty)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingHorizontal: 20, paddingVertical: 14,
                      borderBottomWidth: 1, borderBottomColor: c.borderLight,
                    }}
                  >
                    <InitialsAvatar name={faculty.name} size={40} bg={c.primary + '20'} textColor={c.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{faculty.name}</Text>
                      <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>{faculty.department}</Text>
                      {faculty.designation && (
                        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>{faculty.designation}</Text>
                      )}
                      {faculty.subjects.length > 0 && (
                        <Text style={{ fontSize: 10, color: c.textTertiary, marginTop: 2 }}>
                          {faculty.subjects.map(s => s.code).join(', ')}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={16} color={c.textDarkest} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}
