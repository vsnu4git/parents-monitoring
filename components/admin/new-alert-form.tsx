'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(5),
  message: z.string().min(20),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  targetScope: z.enum(['INSTITUTION', 'DEPARTMENT', 'INDIVIDUAL']),
})

type FormData = z.infer<typeof schema>

export function NewAlertForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { severity: 'WARNING', targetScope: 'INSTITUTION' }
  })

  const severity = watch('severity')

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Emergency alert sent successfully')
        router.push('/admin/alerts')
        router.refresh()
      } else {
        toast.error('Failed to send alert')
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
        {severity === 'CRITICAL' && (
          <div
            className="flex items-start gap-3 mb-5 p-3 rounded-xl"
            style={{ backgroundColor: '#1C1012', border: '1px solid #7F1D1D' }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
            <p className="text-sm" style={{ color: '#FCA5A5' }}>
              This will send a CRITICAL alert visible to all parents immediately.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label style={labelStyle}>Alert Title</label>
            <input
              placeholder="Brief title for the alert..."
              {...register('title')}
              style={inputStyle}
            />
            {errors.title && <p className="text-sm mt-1" style={{ color: '#EF4444' }}>{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Severity</label>
              <select
                defaultValue="WARNING"
                onChange={(e) => setValue('severity', e.target.value as 'INFO' | 'WARNING' | 'CRITICAL')}
                style={inputStyle}
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target</label>
              <select
                defaultValue="INSTITUTION"
                onChange={(e) => setValue('targetScope', e.target.value as 'INSTITUTION' | 'DEPARTMENT' | 'INDIVIDUAL')}
                style={inputStyle}
              >
                <option value="INSTITUTION">All (Institution)</option>
                <option value="DEPARTMENT">Department</option>
                <option value="INDIVIDUAL">Individual</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              rows={5}
              placeholder="Detailed message for parents..."
              {...register('message')}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            {errors.message && <p className="text-sm mt-1" style={{ color: '#EF4444' }}>{errors.message.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: severity === 'CRITICAL' ? '#DC2626' : '#FAFAFA',
                color: severity === 'CRITICAL' ? '#FAFAFA' : '#09090B',
              }}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : 'Send Alert'}
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
