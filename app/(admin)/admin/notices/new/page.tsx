import { NewNoticeForm } from '@/components/admin/new-notice-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewNoticePage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/admin/notices"
            className="inline-flex items-center gap-1 text-xs mb-3 transition-colors"
            style={{ color: '#71717A' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to notices
          </Link>
          <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>
            Publish Notice
          </h1>
          <p className="text-sm mt-1" style={{ color: '#71717A' }}>
            Create and publish a notice for parents
          </p>
        </div>

        {/* Form wrapper */}
        <div
          className="rounded-2xl p-4 sm:p-6"
          style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
        >
          <NewNoticeForm />
        </div>
      </div>
    </div>
  )
}
