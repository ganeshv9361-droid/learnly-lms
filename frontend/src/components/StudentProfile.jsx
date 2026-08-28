import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import AnimatedCounter from './AnimatedCounter'

export default function StudentProfile({ user }) {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ bio:'', linkedin:'', twitter:'', website:'' })
  const [uploading, setUploading] = useState(false)
  const [streak, setStreak] = useState({current_streak:0, longest_streak:0, total_days:0})
  const [certs, setCerts] = useState(0)
  const fileRef = useRef()

  useEffect(() => {
    api.get('/profile/my').then(r => {
      setProfile(r.data)
      setForm({
        bio: r.data.bio || '',
        linkedin: r.data.linkedin || '',
        twitter: r.data.twitter || '',
        website: r.data.website || ''
      })
    })
    api.get('/streaks/my').then(r => setStreak(r.data))
    api.get('/certificates/my').then(r => setCerts(r.data.length))
  }, [])

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await api.post('/profile/upload-avatar', fd)
      setProfile(p => ({...p, avatar_url: r.data.avatar_url}))
    } catch(e) { alert('Upload failed') }
    setUploading(false)
  }

  const saveProfile = async () => {
    await api.patch('/profile/update', form)
    setProfile(p => ({...p, ...form}))
    setEditing(false)
  }

  if (!profile) return <div className="text-gray-500 text-sm text-center py-8">Loading...</div>

  return (
    <div className="animate-fade-up max-w-2xl mx-auto space-y-4">
      {/* Profile card */}
      <div className="card-base p-6">
        <div className="flex items-start gap-5 mb-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden"
              style={{background:'linear-gradient(135deg,#7c3aed,#06b6d4)'}}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{position:'absolute',bottom:-8,right:-8,width:28,height:28,borderRadius:'50%',background:'#7c3aed',border:'2px solid #080810',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {uploading ? '⏳' : '📷'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold text-white">{profile.name}</div>
            <div className="text-sm text-gray-400">{profile.email}</div>
            <div className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
              style={{background:'rgba(124,58,237,0.2)',color:'#a78bfa'}}>
              {profile.role}
            </div>
          </div>
          <button onClick={() => setEditing(e => !e)}
            style={{background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.2)',color:'#a78bfa',padding:'8px 16px',borderRadius:12,fontSize:13,cursor:'pointer'}}>
            {editing ? 'Cancel' : '✏️ Edit'}
          </button>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
          {[
            {label:'Certificates',value:certs,icon:'🏅',color:'#fbbf24'},
            {label:'Day streak',value:streak.current_streak,icon:'🔥',color:'#f97316'},
            {label:'Best streak',value:streak.longest_streak,icon:'⚡',color:'#a78bfa'},
          ].map(s => (
            <div key={s.label} style={{background:'rgba(255,255,255,0.04)',borderRadius:14,padding:'12px',textAlign:'center'}}>
              <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:700,color:s.color}}>
                <AnimatedCounter value={s.value}/>
              </div>
              <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {!editing ? (
          <div className="space-y-3">
            {profile.bio && (
              <div>
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Bio</div>
                <div className="text-sm text-gray-300">{profile.bio}</div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#60a5fa',textDecoration:'none'}}>
                  💼 LinkedIn
                </a>
              )}
              {profile.twitter && (
                <a href={profile.twitter} target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#60a5fa',textDecoration:'none'}}>
                  🐦 Twitter
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#60a5fa',textDecoration:'none'}}>
                  🌐 Website
                </a>
              )}
            </div>
            {!profile.bio && !profile.linkedin && (
              <div className="text-sm text-gray-600">No profile info yet. Click Edit to add your bio and links.</div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">Bio</label>
              <textarea value={form.bio} onChange={e => setForm({...form,bio:e.target.value})}
                className="input-base h-24 resize-none" placeholder="Tell others about yourself..."/>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">LinkedIn URL</label>
              <input value={form.linkedin} onChange={e => setForm({...form,linkedin:e.target.value})}
                className="input-base" placeholder="https://linkedin.com/in/yourname"/>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">Twitter URL</label>
              <input value={form.twitter} onChange={e => setForm({...form,twitter:e.target.value})}
                className="input-base" placeholder="https://twitter.com/yourname"/>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">Website</label>
              <input value={form.website} onChange={e => setForm({...form,website:e.target.value})}
                className="input-base" placeholder="https://yourwebsite.com"/>
            </div>
            <button onClick={saveProfile}
              className="btn-primary text-white w-full py-2.5 rounded-xl text-sm font-semibold">
              Save Profile
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
