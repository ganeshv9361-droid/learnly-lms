import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Particles from '../components/Particles'
import Logo from '../components/Logo'

export default function Login({ onSwitch }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(form.email, form.password)
    } catch {
      setError('Invalid email or password')
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{
        background:
          'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.08) 0%, transparent 60%), #080810'
      }}
    >
      <Particles />

      <div className="relative z-10 w-full max-w-sm py-8">
        <div className="text-center mb-4 animate-fade-up">
          <div className="flex justify-center mb-3">
            <div className="animate-pulse-glow rounded-3xl p-1">
              <Logo size={52} showText={false} />
            </div>
          </div>

          <div className="flex justify-center">
            <Logo size={0} showText={true} textSize="text-3xl" />
          </div>

          <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
            The platform for continuous learning
          </p>
        </div>

        <div
          className="card-base animate-fade-up delay-100 p-5"
          style={{
            background: 'rgba(13,13,26,0.85)',
            backdropFilter: 'blur(40px)'
          }}
        >
          {error && (
            <div
              className="animate-scale-in mb-4 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5'
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
                style={{ color: 'var(--text3)' }}
              >
                Email
              </label>

              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-base"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
                style={{ color: 'var(--text3)' }}
              >
                Password
              </label>

              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="input-base pr-12"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--text3)' }}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in →'
              )}
            </button>
          </form>

          <div
            className="mt-5 pt-4 border-t text-center"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              New to Learnly?{' '}
              <button
                onClick={onSwitch}
                className="font-semibold hover:opacity-80 transition"
                style={{ color: '#a78bfa' }}
              >
                Create account →
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-3" style={{ color: 'var(--text3)' }}>
          🔒 Secured with JWT authentication
        </p>
      </div>
    </div>
  )
}