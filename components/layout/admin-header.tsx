'use client'

import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { LogOut } from 'lucide-react'

interface AdminHeaderProps {
  user: { name?: string | null; email?: string | null; role: string }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'

  return (
    <header
      className="sticky top-0 z-40 px-4 lg:px-8 py-3"
      style={{
        backgroundColor: '#09090B',
        borderBottom: '1px solid #27272A',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
            style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
          >
            Administrator
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:block" style={{ color: '#A1A1AA' }}>{user.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-9 w-9 rounded-full p-0 inline-flex items-center justify-center hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 outline-none transition-opacity duration-150">
              <Avatar className="h-9 w-9">
                <AvatarFallback
                  style={{
                    backgroundColor: '#27272A',
                    color: '#FAFAFA',
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
                <p className="text-xs" style={{ color: '#71717A' }}>{user.email}</p>
              </div>
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
