import { NewAlertForm } from '@/components/admin/new-alert-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewAlertPage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/admin/alerts"
            className="inline-flex items-center gap-1 text-xs mb-3 transition-colors"
            style={{ color: '#71717A' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to alerts
          </Link>
          <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>
            Send Alert
          </h1>
          <p className="text-sm mt-1" style={{ color: '#71717A' }}>
            Broadcast an urgent message to parents
          </p>
        </div>

        {/* Form wrapper */}
        <div
          className="rounded-2xl p-4 sm:p-6"
          style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
        >
          <NewAlertForm />
        </div>
      </div>
    </div>
  )
}
