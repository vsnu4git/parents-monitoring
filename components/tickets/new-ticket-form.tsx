'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  category: z.string().min(1, 'Please select a category'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  priority: z.string().min(1, 'Please select priority'),
})

type FormData = z.infer<typeof schema>

const categories = ['ATTENDANCE', 'MARKS', 'FEE', 'LEAVE', 'GENERAL', 'COMPLAINT', 'OTHER']
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

interface NewTicketFormProps {
  parentId: string
  students: { id: string; name: string; registerNumber: string }[]
}

export function NewTicketForm({ parentId, students }: NewTicketFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM', studentId: students[0]?.id ?? '' }
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, parentId })
      })
      if (res.ok) {
        toast.success('Ticket created successfully')
        router.push('/dashboard/tickets')
        router.refresh()
      } else {
        toast.error('Failed to create ticket')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--pms-card)',
    border: '1px solid var(--pms-border)',
    color: 'var(--pms-text)',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    transition: 'border-color 150ms',
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--pms-text-sec)',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: 'var(--pms-card)',
        border: '1px solid var(--pms-border)',
      }}
    >
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label style={labelStyle}>Student</label>
            <select
              defaultValue={students[0]?.id ?? ''}
              onChange={(e) => setValue('studentId', e.target.value)}
              style={inputStyle}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.registerNumber})</option>
              ))}
            </select>
            {errors.studentId && <p className="text-sm mt-1" style={{ color: '#EF4444' }}>{errors.studentId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Category</label>
              <select
                onChange={(e) => { if (e.target.value) setValue('category', e.target.value) }}
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
              <label style={labelStyle}>Priority</label>
              <select
                defaultValue="MEDIUM"
                onChange={(e) => setValue('priority', e.target.value)}
                style={inputStyle}
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Subject</label>
            <input
              placeholder="Brief description of the issue..."
              {...register('subject')}
              style={inputStyle}
            />
            {errors.subject && <p className="text-sm mt-1" style={{ color: '#EF4444' }}>{errors.subject.message}</p>}
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              rows={5}
              placeholder="Describe the issue in detail..."
              {...register('description')}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            {errors.description && <p className="text-sm mt-1" style={{ color: '#EF4444' }}>{errors.description.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: 'var(--pms-text)',
                color: 'var(--pms-bg)',
              }}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Ticket'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--pms-border)',
                color: 'var(--pms-text-sec)',
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
