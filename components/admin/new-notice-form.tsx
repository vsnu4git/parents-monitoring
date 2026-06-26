'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(5),
  content: z.string().min(20),
  category: z.string().min(1),
  requiresAcknowledgement: z.boolean().optional().default(false),
})

type FormData = z.infer<typeof schema>

const categories = ['General', 'Examination', 'Fee', 'Event', 'Holiday', 'Sports', 'Placement']

export function NewNoticeForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [requiresAck, setRequiresAck] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { requiresAcknowledgement: false },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, requiresAcknowledgement: requiresAck })
      })
      if (res.ok) {
        toast.success('Notice published successfully')
        router.push('/admin/notices')
        router.refresh()
      } else {
        toast.error('Failed to publish notice')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#18181B',
    border: '1px solid #27272A',
    color: '#FAFAFA',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    transition: 'border-color 150ms',
  }

  const labelStyle: React.CSSProperties = {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: '#09090B',
        border: '1px solid #27272A',
      }}
    >
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label style={labelStyle}>Title</label>
            <input
              placeholder="Notice title..."
              {...register('title')}
              style={inputStyle}
            />
            {errors.title && <p className="text-sm mt-1" style={{ color: '#EF4444' }}>{errors.title.message}</p>}
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select
              onChange={(e) => { if (e.target.value) setValue('category' as any, e.target.value as any) }}
              defaultValue=""
              style={inputStyle}
            >
              <option value="" disabled>Select category</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-sm mt-1" style={{ color: '#EF4444' }}>{errors.category.message}</p>}
          </div>

          <div>
            <label style={labelStyle}>Content</label>
            <textarea
              rows={6}
              placeholder="Write the notice content..."
              {...register('content')}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            {errors.content && <p className="text-sm mt-1" style={{ color: '#EF4444' }}>{errors.content.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ack"
              checked={requiresAck}
              onChange={e => setRequiresAck(e.target.checked)}
              className="rounded"
              style={{ accentColor: '#FAFAFA' }}
            />
            <label htmlFor="ack" className="cursor-pointer text-sm" style={{ color: '#A1A1AA' }}>
              Require parent acknowledgement
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: '#FAFAFA',
                color: '#09090B',
              }}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Publishing...</> : 'Publish Notice'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #27272A',
                color: '#A1A1AA',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
