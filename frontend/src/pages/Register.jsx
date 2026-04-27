import { useState, useEffect } from 'react'
import api from '../api/axios'
import Particles from '../components/Particles'
import Logo from '../components/Logo'

export default function Register({ onSwitch }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'student', referral_code:'' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) setForm(f => ({...f,referral_code:ref}))
  }, [])

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {...form}
      if (!payload.referral_code) delete payload.referral_code
      await api.post('/users/register', payload)
      setSuccess(true)
    } catch(err) {
      setError(err.response?.data?.detail||'Registration failed')
    }
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{background:'#080810'}}>
      <Particles />
      <div className="relative z-10 text-center animate-scale-in">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6"
          style={{background:'rgba(52,211,153,0.1)',border:'2px solid rgba(52,211,153,0.4)'}}>
          ✓
        </div>
        <h2 className="font-display text-3xl font-bold text-white mb-2">You're in!</h2>
        <p className="mb-8" style={{color:'var(--text2)'}}>Account created. Start learning today.</p>
        <button onClick={onSwitch} className="btn-primary text-white px-8 py-3 rounded-2xl font-semibold">
          Sign in now →
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8"
      style={{background:'radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(124,58,237,0.1) 0%, transparent 50%), #080810'}}>
      <Particles />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6 animate-fade-up">
          <div className="flex justify-center mb-3">
            <Logo size={52} showText={false}/>
          </div>
          <Logo size={0} showText={true} textSize="text-3xl"/>
          <p className="text-sm mt-1" style={{color:'var(--text3)'}}>Join thousands of learners</p>
        </div>

        <div className="card-base animate-fade-up delay-100 p-6 sm:p-8"
          style={{background:'rgba(13,13,26,0.85)',backdropFilter:'blur(40px)'}}>

          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">Create account</h2>
            <p className="text-sm mt-0.5" style={{color:'var(--text3)'}}>Free forever. No credit card needed.</p>
          </div>

          {error && (
            <div className="animate-scale-in mb-4 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm"
              style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#fca5a5'}}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{color:'var(--text3)'}}>Full name</label>
              <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                className="input-base" placeholder="Your full name"/>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{color:'var(--text3)'}}>Email</label>
              <input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                className="input-base" placeholder="you@example.com"/>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{color:'var(--text3)'}}>Password</label>
              <div className="relative">
                <input type={showPass?'text':'password'} required value={form.password}
                  onChange={e=>setForm({...form,password:e.target.value})}
                  className="input-base pr-12" placeholder="Min 8 characters"/>
                <button type="button" onClick={()=>setShowPass(s=>!s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{color:'var(--text3)'}}>
                  {showPass?'Hide':'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{color:'var(--text3)'}}>I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {[['student','🎓','Student'],['teacher','👨‍🏫','Teacher']].map(([role,icon,label]) => (
                  <button key={role} type="button" onClick={()=>setForm({...form,role})}
                    className={`py-3 rounded-2xl text-sm font-medium transition-all ${form.role===role?'btn-primary text-white':'btn-ghost text-white/60 hover:text-white'}`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{color:'var(--text3)'}}>
                Referral code <span className="normal-case opacity-50">(optional)</span>
              </label>
              <input value={form.referral_code} onChange={e=>setForm({...form,referral_code:e.target.value})}
                className="input-base" placeholder="Enter code"/>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Creating account...
                </span>
              ) : 'Create account →'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t text-center" style={{borderColor:'rgba(255,255,255,0.06)'}}>
            <p className="text-sm" style={{color:'var(--text3)'}}>
              Already have an account?{' '}
              <button onClick={onSwitch} className="font-semibold hover:opacity-80 transition" style={{color:'#a78bfa'}}>
                Sign in →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}