'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    try {
      await fetch('/api/student-auth', { method: 'DELETE' })
      router.push('/login')
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150"
      style={{
        backgroundColor: 'var(--pms-card)',
        border: '1px solid var(--pms-border)',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <LogOut className="w-4 h-4" style={{ color: '#EF4444' }} />
      <span className="text-sm font-semibold" style={{ color: '#EF4444' }}>
        {loading ? 'Signing out...' : 'Sign Out'}
      </span>
    </button>
  )
}
