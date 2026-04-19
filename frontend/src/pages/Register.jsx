import { useState, useEffect } from 'react'
import api from '../api/axios'
import Particles from '../components/Particles'

export default function Register({ onSwitch }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'student', referral_code:'' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setForm(f => ({...f, referral_code: ref}))
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
      setError(err.response?.data?.detail || 'Registration failed')
    }
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{background:'linear-gradient(135deg,#0a0a0f,#0f0a1f,#0a0f1a)'}}>
      <Particles />
      <div className="relative z-10 text-center animate-fade-up">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6"
          style={{background:'rgba(52,211,153,0.15)', border:'2px solid #34d399'}}>✓</div>
        <h2 className="font-display text-3xl font-bold text-white mb-2">You're in!</h2>
        <p className="text-gray-400 mb-8">Account created successfully</p>
        <button onClick={onSwitch} className="btn-primary text-white px-8 py-3 rounded-xl font-semibold">
          Sign in now →
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{background:'linear-gradient(135deg,#0a0a0f 0%,#0f0a1f 50%,#0a0f1a 100%)'}}>
      <Particles />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10"
        style={{background:'radial-gradient(circle,#06b6d4,transparent)',filter:'blur(60px)'}}/>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl btn-primary mb-4">
            <span className="font-display text-2xl text-white">✦</span>
          </div>
          <h1 className="font-display text-4xl font-bold gradient-text mb-2">Join Learnly</h1>
          <p className="text-gray-400 text-sm">Start your learning journey today</p>
        </div>
        <div className="animate-fade-up delay-200 rounded-2xl p-8"
          style={{background:'rgba(15,17,23,0.9)',border:'1px solid rgba(124,58,237,0.2)',backdropFilter:'blur(20px)'}}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span>⚠</span>{error}
            </div>
          )}
          <form onSubmit={handle} className="space-y-4">
            {[
              {label:'Full name',key:'name',type:'text',placeholder:'Your full name'},
              {label:'Email',key:'email',type:'email',placeholder:'you@example.com'},
              {label:'Password',key:'password',type:'password',placeholder:'Min 8 characters'},
            ].map(({label,key,type,placeholder}) => (
              <div key={key}>
                <label className="text-xs text-gray-400 mb-2 block font-medium tracking-wide uppercase">{label}</label>
                <input type={type} required value={form[key]}
                  onChange={e => setForm({...form,[key]:e.target.value})}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200"
                  style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}
                  placeholder={placeholder}
                  onFocus={e => e.target.style.border='1px solid rgba(124,58,237,0.6)'}
                  onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.1)'}/>
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium tracking-wide uppercase">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {[['student','🎓','Student'],['teacher','👨‍🏫','Teacher']].map(([role,icon,label]) => (
                  <button key={role} type="button" onClick={() => setForm({...form,role})}
                    className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 ${form.role===role?'btn-primary text-white':'text-gray-400 hover:text-white'}`}
                    style={form.role!==role?{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}:{}}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium tracking-wide uppercase">
                Referral code <span className="normal-case text-gray-600">(optional)</span>
              </label>
              <input value={form.referral_code}
                onChange={e => setForm({...form,referral_code:e.target.value})}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200"
                style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}
                placeholder="Enter referral code"
                onFocus={e => e.target.style.border='1px solid rgba(124,58,237,0.6)'}
                onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.1)'}/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Creating account...
                </span>
              ) : 'Create account →'}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <button onClick={onSwitch} className="text-violet-400 hover:text-violet-300 font-medium transition">
                Sign in →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}