import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#09090B' }}
    >
      {/* Top section - branding */}
      <div className="flex-1 flex flex-col items-center justify-end pb-8 px-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: '#FAFAFA' }}
        >
          <span className="text-xl font-black" style={{ color: '#09090B' }}>P</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>
          Welcome back
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#71717A' }}>
          Sign in to continue to PMS
        </p>
      </div>

      {/* Bottom section - form */}
      <div className="flex-1 flex flex-col justify-start px-6 pt-6">
        <LoginForm />
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center">
        <p className="text-[11px]" style={{ color: '#3F3F46' }}>
          Madras Engineering College
        </p>
      </div>
    </div>
  )
}
