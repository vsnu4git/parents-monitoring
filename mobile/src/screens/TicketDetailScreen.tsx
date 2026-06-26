import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { getTicket, addTicketReply } from '../api/endpoints'
import { useAuth } from '../auth/AuthContext'
import { Card } from '../components/Card'
import { StatusChip } from '../components/StatusChip'
import { LoadingScreen } from '../components/LoadingScreen'
import { useTheme } from '../hooks/useTheme'
import { formatDateTime } from '../utils/format'
import type { TicketsStackParamList } from '../types/navigation'

type Route = RouteProp<TicketsStackParamList, 'TicketDetail'>

export function TicketDetailScreen() {
  const { c, spacing } = useTheme()
  const { params } = useRoute<Route>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')

  const { data: ticket, isLoading, refetch } = useQuery({
    queryKey: ['ticket', params.ticketId],
    queryFn: () => getTicket(params.ticketId),
  })

  const replyMutation = useMutation({
    mutationFn: () => addTicketReply(params.ticketId, message),
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['ticket', params.ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        content: { padding: spacing.md, gap: spacing.md },
        subject: { fontSize: 18, fontWeight: '700', color: c.text },
        metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
        description: { fontSize: 14, color: c.text, marginTop: spacing.md, lineHeight: 20 },
        date: { fontSize: 12, color: c.textSecondary, marginTop: spacing.sm },
        sectionTitle: { fontSize: 16, fontWeight: '700', color: c.text },
        reply: {
          backgroundColor: c.surface,
          borderRadius: 12,
          padding: spacing.md,
          borderLeftWidth: 3,
          borderLeftColor: c.border,
        },
        replyOwn: { borderLeftColor: c.primary },
        replyHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        replyName: { fontSize: 13, fontWeight: '600', color: c.text },
        replyTime: { fontSize: 11, color: c.textTertiary },
        replyMessage: { fontSize: 14, color: c.text, marginTop: spacing.xs, lineHeight: 20 },
        replyBar: {
          flexDirection: 'row',
          padding: spacing.sm,
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.border,
          alignItems: 'flex-end',
          gap: spacing.sm,
        },
        replyInput: {
          flex: 1,
          backgroundColor: c.surfaceVariant,
          borderRadius: 12,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
          fontSize: 14,
          color: c.text,
          maxHeight: 100,
        },
        sendButton: {
          backgroundColor: c.primary,
          borderRadius: 12,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
        },
        sendDisabled: { opacity: 0.4 },
        sendText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
      }),
    [c, spacing],
  )

  if (isLoading) return <LoadingScreen />
  if (!ticket) return null

  const canReply = ticket.status !== 'CLOSED'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)}>
          <Card>
            <Text style={styles.subject}>{ticket.subject}</Text>
            <View style={styles.metaRow}>
              <StatusChip status={ticket.status} />
              <StatusChip status={ticket.priority} />
              <StatusChip status={ticket.category} />
            </View>
            <Text style={styles.description}>{ticket.description}</Text>
            <Text style={styles.date}>
              {ticket.student?.name} - {formatDateTime(ticket.createdAt)}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)}>
          <Text style={styles.sectionTitle}>
            Replies ({ticket.replies?.length || 0})
          </Text>
        </Animated.View>

        {ticket.replies?.map((reply) => {
          const isOwn = reply.senderId === user?.id
          return (
            <View key={reply.id} style={[styles.reply, isOwn && styles.replyOwn]}>
              <View style={styles.replyHeader}>
                <Text style={styles.replyName}>
                  {reply.sender?.name || (isOwn ? 'You' : reply.senderRole)}
                </Text>
                <Text style={styles.replyTime}>{formatDateTime(reply.createdAt)}</Text>
              </View>
              <Text style={styles.replyMessage}>{reply.message}</Text>
            </View>
          )
        })}
      </ScrollView>

      {canReply && (
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a reply..."
            placeholderTextColor={c.textTertiary}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendDisabled]}
            onPress={() => replyMutation.mutate()}
            disabled={!message.trim() || replyMutation.isPending}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}
