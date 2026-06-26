import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react-native'
import { getConversationMessages, sendChatMessage } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../auth/AuthContext'
import type { MoreStackParamList } from '../types/navigation'
import type { ChatMessageItem } from '../types/api'

type Route = RouteProp<MoreStackParamList, 'ChatDetail'>

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

function shouldShowDateHeader(current: ChatMessageItem, prev?: ChatMessageItem) {
  if (!prev) return true
  const a = new Date(current.createdAt).toDateString()
  const b = new Date(prev.createdAt).toDateString()
  return a !== b
}

export function ChatDetailScreen() {
  const route = useRoute<Route>()
  const { conversationId, facultyName } = route.params
  const { c, spacing } = useTheme()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const flatListRef = useRef<FlatList>(null)
  const [message, setMessage] = useState('')

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => getConversationMessages(conversationId),
    refetchInterval: 3000,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendChatMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const handleSend = useCallback(() => {
    const trimmed = message.trim()
    if (!trimmed) return
    setMessage('')
    sendMutation.mutate(trimmed)
  }, [message, sendMutation])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages?.length])

  const isOwnMessage = useCallback((msg: ChatMessageItem) => {
    return msg.senderRole === 'PARENT'
  }, [])

  if (isLoading && !messages) return <LoadingScreen />

  const sortedMessages = [...(messages || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)} style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={sortedMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.sm }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 14, color: c.textMuted }}>No messages yet. Say hello!</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const own = isOwnMessage(item)
          const showDate = shouldShowDateHeader(item, sortedMessages[index - 1])

          return (
            <View>
              {showDate && (
                <View style={{ alignItems: 'center', marginVertical: 12 }}>
                  <View style={{
                    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
                    backgroundColor: c.surfaceVariant,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: c.textMuted }}>
                      {formatDateHeader(item.createdAt)}
                    </Text>
                  </View>
                </View>
              )}
              <View style={{
                alignSelf: own ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
                marginBottom: 6,
              }}>
                <View style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
                  backgroundColor: own ? c.primary : c.surface,
                  borderWidth: own ? 0 : 1,
                  borderColor: c.border,
                  borderBottomRightRadius: own ? 4 : 16,
                  borderBottomLeftRadius: own ? 16 : 4,
                }}>
                  <Text style={{
                    fontSize: 14, color: own ? c.buttonText : c.text, lineHeight: 20,
                  }}>
                    {item.content}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 9, color: c.textMuted, marginTop: 3,
                  alignSelf: own ? 'flex-end' : 'flex-start',
                  marginHorizontal: 4,
                }}>
                  {formatMsgTime(item.createdAt)}
                </Text>
              </View>
            </View>
          )
        }}
      />
      </Animated.View>

      {/* Input Bar */}
      <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)}>
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.borderLight,
      }}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor={c.textMuted}
          multiline
          maxLength={2000}
          style={{
            flex: 1, minHeight: 40, maxHeight: 120,
            backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder,
            borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
            fontSize: 14, color: c.text,
          }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!message.trim()}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: message.trim() ? c.primary : c.surfaceVariant,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={18} color={message.trim() ? c.buttonText : c.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      </Animated.View>
    </KeyboardAvoidingView>
  )
}
