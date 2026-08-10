import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Particles from '../components/Particles'
import Logo from '../components/Logo'
import { signInWithGoogle } from '../firebase'

export default function Login({ onSwitch }) {
  const { login, loginWithFirebase } = useAuth()

  const [form, setForm] = useState({
    email: '',
    password: ''
  })

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

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await signInWithGoogle()
      const token = await result.user.getIdToken()
      await loginWithFirebase(token)
    } catch(e) {
      setError('Google sign-in failed. Try again.')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen min-h-dvh relative overflow-y-auto px-4 flex justify-center"
      style={{
        paddingTop: '50px',
        paddingBottom: '40px',
        background:
          'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.08) 0%, transparent 60%), #080810'
      }}
    >
      <Particles />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* LOGO */}
        <div className="text-center mb-5 animate-fade-up">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="Learnly"
              className="w-20 h-20 object-contain mx-auto"
            />
          </div>

          <div className="flex justify-center">
            <Logo
              size={0}
              showText={true}
              textSize="text-4xl"
            />
          </div>

          <p
            className="text-sm mt-1"
            style={{ color: 'var(--text3)' }}
          >
            The platform for continuous learning
          </p>
        </div>

        {/* LOGIN BOX */}
        <div
          className="animate-fade-up delay-100 p-6 rounded-2xl border border-white/10 w-full"
          style={{
            background: 'rgba(12,12,24,0.55)',
            WebkitBackdropFilter: 'blur(25px)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)'
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

          <form
            onSubmit={handleEmailLogin}
            className="space-y-4"
          >
            {/* EMAIL */}
            <div>
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-widest"
                style={{ color: 'var(--text3)' }}
              >
                Email
              </label>

              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
                className="input-base w-full"
                placeholder="you@example.com"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-widest"
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
                    setForm({
                      ...form,
                      password: e.target.value
                    })
                  }
                  className="input-base w-full pr-14"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPass((s) => !s)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--text3)' }}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50"
            >
              {loading
                ? 'Signing in...'
                : 'Sign in →'}
            </button>

            {/* Divider */}
            <div style={{display:'flex',alignItems:'center',gap:12,margin:'8px 0'}}>
              <div style={{flex:1,height:1,background:'rgba(255,255,255,0.08)'}}/>
              <span style={{fontSize:12,color:'#4a5280'}}>or</span>
              <div style={{flex:1,height:1,background:'rgba(255,255,255,0.08)'}}/>
            </div>

            {/* Google Sign In */}
            <button type="button" onClick={handleGoogle} disabled={loading}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'12px',borderRadius:16,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white',fontSize:14,fontWeight:500,cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e => e.target.style.background='rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.06)'}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* REGISTER */}
          <div
            className="mt-5 pt-4 border-t text-center"
            style={{
              borderColor:
                'rgba(255,255,255,0.06)'
            }}
          >
            <p
              className="text-sm"
              style={{ color: 'var(--text3)' }}
            >
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

        {/* FOOTER */}
        <p
          className="text-center text-xs mt-3"
          style={{ color: 'var(--text3)' }}
        >
          🔒 Secured with JWT authentication
        </p>
      </div>
    </div>
  )
}