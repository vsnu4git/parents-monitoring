'use client'

import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'
import Link from 'next/link'

interface ParentHeaderProps {
  user: { name?: string | null; email?: string | null; role: string }
}

export function ParentHeader({ user }: ParentHeaderProps) {
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'

  return (
    <header
      className="sticky top-0 z-40 px-4 lg:px-8 py-3"
      style={{
        backgroundColor: 'var(--pms-bg)',
        borderBottom: '1px solid var(--pms-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="lg:hidden">
          <p className="font-semibold text-sm" style={{ color: 'var(--pms-text)' }}>Parent Portal</p>
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:block" style={{ color: 'var(--pms-text-sec)' }}>{user.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-9 w-9 rounded-full p-0 inline-flex items-center justify-center hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 outline-none transition-opacity duration-150">
              <Avatar className="h-9 w-9">
                <AvatarFallback
                  style={{
                    backgroundColor: 'var(--pms-border)',
                    color: 'var(--pms-text)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="px-2 py-2">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/dashboard/profile" className="flex items-center w-full cursor-pointer">
                  <User className="mr-2 h-4 w-4" />Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="mr-2 h-4 w-4" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
