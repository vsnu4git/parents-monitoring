'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

export function TicketReplyForm({ ticketId, parentId }: { ticketId: string; parentId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      if (res.ok) {
        toast.success('Reply sent')
        setMessage('')
        router.refresh()
      } else {
        toast.error('Failed to send reply')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: 'var(--pms-card)',
        border: '1px solid var(--pms-border)',
      }}
    >
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={3}
            placeholder="Write your reply..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={isLoading}
            style={{
              backgroundColor: 'var(--pms-bg)',
              border: '1px solid var(--pms-border)',
              color: 'var(--pms-text)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 14,
              width: '100%',
              outline: 'none',
              resize: 'vertical',
              transition: 'border-color 150ms',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{
              backgroundColor: 'var(--pms-text)',
              color: 'var(--pms-bg)',
            }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Reply
          </button>
        </form>
      </div>
    </div>
  )
}
