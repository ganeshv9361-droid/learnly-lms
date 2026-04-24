import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Particles from '../components/Particles'

export default function Login({ onSwitch }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ email:'', password:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{background:'linear-gradient(135deg, #0a0a0f 0%, #0f0a1f 50%, #0a0f1a 100%)'}}>
      <Particles />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 animate-spin-slow"
        style={{background:'radial-gradient(circle, #7c3aed, transparent)', filter:'blur(60px)'}}/>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
        style={{background:'radial-gradient(circle, #06b6d4, transparent)', filter:'blur(60px)', animation:'float 4s ease-in-out infinite'}}/>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl btn-primary mb-4 animate-pulse-glow">
            <span className="font-display text-2xl text-white">✦</span>
          </div>
          <h1 className="font-display text-4xl font-bold gradient-text mb-2">Learnly</h1>
          <p className="text-gray-400 text-sm">Your gateway to knowledge</p>
          <p className="text-gray-400 text-sm">By Ganesh.V</p>
        </div>

        <div className="glass rounded-2xl p-8 animate-fade-up delay-200"
          style={{background:'rgba(15,17,23,0.8)', border:'1px solid rgba(124,58,237,0.2)'}}>
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to continue learning</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 animate-fade-in flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium tracking-wide uppercase">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200"
                style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}
                placeholder="you@example.com"
                onFocus={e => e.target.style.border='1px solid rgba(124,58,237,0.6)'}
                onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.1)'}/>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium tracking-wide uppercase">Password</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({...form, password:e.target.value})}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200"
                style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}
                placeholder="••••••••"
                onFocus={e => e.target.style.border='1px solid rgba(124,58,237,0.6)'}
                onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.1)'}/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Signing in...
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-gray-400">
              New to Learnly?{' '}
              <button onClick={onSwitch}
                className="text-violet-400 hover:text-violet-300 font-medium transition">
                Create account →
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6 animate-fade-up delay-400">
          🔒 Secured with JWT Authentication
        </p>
      </div>
    </div>
  )
}