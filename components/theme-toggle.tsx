'use client'

import { useTheme } from './theme-provider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150"
      style={{
        backgroundColor: 'var(--pms-card)',
        border: '1px solid var(--pms-border)',
      }}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" style={{ color: 'var(--pms-text-sec)' }} />
      ) : (
        <Moon className="w-4 h-4" style={{ color: 'var(--pms-text-sec)' }} />
      )}
    </button>
  )
}
