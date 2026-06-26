'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter your email or register number'),
  password: z.string().min(4, 'Minimum 4 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const identifier = data.identifier.trim()

      if (isEmail(identifier)) {
        const result = await signIn('credentials', {
          email: identifier,
          password: data.password,
          redirect: false,
        })

        if (result?.error) {
          setError('Invalid email or password')
        } else {
          const response = await fetch('/api/auth/session')
          const session = await response.json()
          const role = session?.user?.role
          if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'FACULTY') {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
          router.refresh()
        }
      } else {
        const res = await fetch('/api/student-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registerNumber: identifier,
            password: data.password,
          }),
        })

        if (!res.ok) {
          const body = await res.json()
          setError(body.error || 'Invalid credentials')
        } else {
          router.push('/student')
          router.refresh()
        }
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm mx-auto space-y-4">
      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#1C1111', color: '#EF4444', border: '1px solid #2D1515' }}
        >
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="identifier"
          className="block text-xs font-medium"
          style={{ color: '#A1A1AA' }}
        >
          Email or Register Number
        </label>
        <input
          id="identifier"
          type="text"
          autoComplete="username"
          placeholder="parent@email.com or CS21001"
          {...register('identifier')}
          disabled={isLoading}
          className="w-full h-12 px-4 rounded-xl text-sm outline-none transition-all duration-150 placeholder:text-[#3F3F46] disabled:opacity-40"
          style={{
            backgroundColor: '#18181B',
            border: '1px solid #27272A',
            color: '#FAFAFA',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#52525B'}
          onBlur={e => e.currentTarget.style.borderColor = '#27272A'}
        />
        {errors.identifier && (
          <p className="text-xs" style={{ color: '#EF4444' }}>{errors.identifier.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-xs font-medium"
          style={{ color: '#A1A1AA' }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          {...register('password')}
          disabled={isLoading}
          className="w-full h-12 px-4 rounded-xl text-sm outline-none transition-all duration-150 placeholder:text-[#3F3F46] disabled:opacity-40"
          style={{
            backgroundColor: '#18181B',
            border: '1px solid #27272A',
            color: '#FAFAFA',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#52525B'}
          onBlur={e => e.currentTarget.style.borderColor = '#27272A'}
        />
        {errors.password && (
          <p className="text-xs" style={{ color: '#EF4444' }}>{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
        style={{ backgroundColor: '#FAFAFA', color: '#09090B' }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>

      <div
        className="mt-6 p-3.5 rounded-xl text-xs leading-relaxed"
        style={{
          backgroundColor: '#111111',
          border: '1px solid #1C1C1C',
          color: '#52525B',
        }}
      >
        <p className="font-medium mb-1.5" style={{ color: '#71717A' }}>Demo accounts</p>
        <p>Parent: mohan@gmail.com / password123</p>
        <p>Student: CS21001 / student123</p>
        <p>Admin: admin@college.edu / password123</p>
      </div>
    </form>
  )
}
