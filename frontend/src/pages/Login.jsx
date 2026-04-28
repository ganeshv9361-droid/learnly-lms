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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{background:'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.08) 0%, transparent 60%), #080810'}}>
      <Particles />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full border opacity-5 animate-spin-slow"
          style={{borderColor:'#7c3aed',borderStyle:'dashed'}}/>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-up">
          <div className="flex justify-center mb-4">
            <div className="animate-pulse-glow rounded-3xl p-1">
              <Logo size={64} showText={false}/>
            </div>
          </div>
          <div className="flex justify-center">
            <Logo size={0} showText={true} textSize="text-4xl"/>
          </div>
          <p className="text-sm mt-2" style={{color:'var(--text3)'}}>
            The platform for continuous learning
          </p>
           <p className="text-sm mt-2" style={{color:'var(--text3)'}}>
            By Ganesh V
          </p>
        </div>

        <div className="card-base animate-fade-up delay-100 p-6 sm:p-8"
          style={{background:'rgba(13,13,26,0.8)',backdropFilter:'blur(40px)'}}>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
            <p className="text-sm mt-1" style={{color:'var(--text3)'}}>Sign in to continue your journey</p>
          </div>

          {error && (
            <div className="animate-scale-in mb-4 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm"
              style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#fca5a5'}}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest"
                style={{color:'var(--text3)'}}>Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="input-base" placeholder="you@example.com"/>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest"
                style={{color:'var(--text3)'}}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="input-base pr-12" placeholder="••••••••"/>
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition"
                  style={{color:'var(--text3)'}}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Signing in...
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t text-center"
            style={{borderColor:'rgba(255,255,255,0.06)'}}>
            <p className="text-sm" style={{color:'var(--text3)'}}>
              New to Learnly?{' '}
              <button onClick={onSwitch}
                className="font-semibold transition hover:opacity-80"
                style={{color:'#a78bfa'}}>
                Create account →
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{color:'var(--text3)'}}>
          🔒 Secured with JWT · 256-bit encrypted
        </p>
      </div>
    </div>
  )
}
