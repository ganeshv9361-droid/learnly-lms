import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Particles from '../components/Particles'
import Logo from '../components/Logo'
import { signInWithGoogle, setupRecaptcha, sendOTP } from '../firebase'

export default function Login({ onSwitch }) {
  const { login, loginWithFirebase } = useAuth()
  const [tab, setTab] = useState('email')
  const [form, setForm] = useState({ email:'', password:'' })
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [confirmResult, setConfirmResult] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const recaptchaRef = useRef(null)

  const handleEmailLogin = async e => {
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
      const firebaseToken = await result.user.getIdToken()
      await loginWithFirebase(firebaseToken)
    } catch(e) {
      setError(e.message || 'Google sign-in failed')
    }
    setLoading(false)
  }

  const handleSendOTP = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const recaptcha = setupRecaptcha('recaptcha-container')
      const formatted = phone.startsWith('+') ? phone : `+91${phone}`
      const result = await sendOTP(formatted, recaptcha)
      setConfirmResult(result)
      setOtpSent(true)
    } catch(e) {
      setError(e.message || 'Failed to send OTP')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await confirmResult.confirm(otp)
      const firebaseToken = await result.user.getIdToken()
      await loginWithFirebase(firebaseToken)
    } catch(e) {
      setError('Invalid OTP. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{background:'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.08) 0%, transparent 60%), #080810'}}>
      <Particles />
      <div id="recaptcha-container"/>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full border opacity-5 animate-spin-slow"
          style={{borderColor:'#7c3aed',borderStyle:'dashed'}}/>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6 animate-fade-up">
          <div className="flex justify-center mb-3">
            <div className="animate-pulse-glow rounded-3xl p-1">
              <Logo size={60} showText={false}/>
            </div>
          </div>
          <div className="flex justify-center">
            <Logo size={0} showText={true} textSize="text-4xl"/>
          </div>
          <p className="text-sm mt-1" style={{color:'var(--text3)'}}>
            The platform for continuous learning
          </p>
        </div>

        <div className="card-base animate-fade-up delay-100 p-6"
          style={{background:'rgba(13,13,26,0.85)',backdropFilter:'blur(40px)'}}>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl mb-5"
            style={{background:'rgba(255,255,255,0.04)'}}>
            {[['email','✉️ Email'],['phone','📱 Phone'],].map(([t,label]) => (
              <button key={t} onClick={() => { setTab(t); setError(''); setOtpSent(false) }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab===t?'btn-primary text-white':'text-gray-400 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="animate-scale-in mb-4 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs"
              style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#fca5a5'}}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Email login */}
          {tab==='email' && (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{color:'var(--text3)'}}>Email</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm({...form,email:e.target.value})}
                  className="input-base" placeholder="you@example.com"/>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{color:'var(--text3)'}}>Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} required value={form.password}
                    onChange={e => setForm({...form,password:e.target.value})}
                    className="input-base pr-12" placeholder="••••••••"/>
                  <button type="button" onClick={() => setShowPass(s=>!s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{color:'var(--text3)'}}>
                    {showPass?'Hide':'Show'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in...</span>
                  : 'Sign in →'}
              </button>
            </form>
          )}

          {/* Phone OTP */}
          {tab==='phone' && !otpSent && (
            <form onSubmit={handleSendOTP} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{color:'var(--text3)'}}>Phone number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-xl text-sm text-gray-400 shrink-0"
                    style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                    🇮🇳 +91
                  </div>
                  <input type="tel" required value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input-base" placeholder="9876543210"
                    maxLength={10}/>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending OTP...</span>
                  : 'Send OTP →'}
              </button>
            </form>
          )}

          {tab==='phone' && otpSent && (
            <form onSubmit={handleVerifyOTP} className="space-y-3">
              <div className="text-center mb-2">
                <div className="text-sm text-green-400 mb-1">✓ OTP sent to +91{phone}</div>
                <div className="text-xs" style={{color:'var(--text3)'}}>Enter the 6-digit code</div>
              </div>
              <div className="flex gap-2 justify-center">
                {[...Array(6)].map((_,i) => (
                  <input key={i}
                    type="text" maxLength={1}
                    value={otp[i]||''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g,'')
                      const newOtp = otp.split('')
                      newOtp[i] = val
                      setOtp(newOtp.join(''))
                      if (val && e.target.nextSibling) e.target.nextSibling.focus()
                    }}
                    onKeyDown={e => {
                      if (e.key==='Backspace' && !otp[i] && e.target.previousSibling) {
                        e.target.previousSibling.focus()
                      }
                    }}
                    className="w-10 h-12 text-center text-lg font-bold text-white rounded-xl outline-none transition-all"
                    style={{background:'rgba(255,255,255,0.06)',border:otp[i]?'1px solid rgba(124,58,237,0.6)':'1px solid rgba(255,255,255,0.1)'}}/>
                ))}
              </div>
              <button type="submit" disabled={loading || otp.length < 6}
                className="btn-primary w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Verifying...</span>
                  : 'Verify OTP →'}
              </button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp('') }}
                className="w-full text-xs py-2" style={{color:'var(--text3)'}}>
                ← Change number
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.07)'}}/>
            <span className="text-xs" style={{color:'var(--text3)'}}>or continue with</span>
            <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.07)'}}/>
          </div>

          {/* Google button */}
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl font-medium text-sm transition-all disabled:opacity-50 btn-ghost text-white hover:border-white/20">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-5 pt-4 border-t text-center" style={{borderColor:'rgba(255,255,255,0.06)'}}>
            <p className="text-sm" style={{color:'var(--text3)'}}>
              New to Learnly?{' '}
              <button onClick={onSwitch} className="font-semibold hover:opacity-80 transition" style={{color:'#a78bfa'}}>
                Create account →
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-3" style={{color:'var(--text3)'}}>
          🔒 Secured with Firebase + JWT encryption
        </p>
      </div>
    </div>
  )
}