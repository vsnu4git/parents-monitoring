import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { PmsThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Parent Monitoring System',
  description: 'College Parent Portal - Academic Transparency Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <PmsThemeProvider>
            {children}
            <Toaster richColors position="top-right" />
          </PmsThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
