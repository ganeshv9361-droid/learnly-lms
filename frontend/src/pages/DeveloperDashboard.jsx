import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import AnimatedCounter from '../components/AnimatedCounter'
import StudentDashboard from './StudentDashboard'
import TeacherDashboard from './TeacherDashboard'

export default function DeveloperDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('overview')
  const [viewAs, setViewAs] = useState(null)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [settlements, setSettlements] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [platformFee, setPlatformFee] = useState(5)
  const [newFee, setNewFee] = useState('')
  const [msg, setMsg] = useState({ text:'', type:'success' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const flash = (text, type='success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text:'', type:'success' }), 3500)
  }

  const loadAll = async () => {
    try {
      const [s, u, se, e, f] = await Promise.all([
        api.get('/developer/stats'),
        api.get('/developer/users'),
        api.get('/developer/settlements'),
        api.get('/developer/platform-earnings'),
        api.get('/developer/platform-fee')
      ])
      setStats(s.data)
      setUsers(u.data)
      setSettlements(se.data)
      setEarnings(e.data)
      setPlatformFee(f.data.platform_fee)
      setNewFee(f.data.platform_fee)
    } catch(e) { flash('Failed to load data', 'error') }
  }

  useEffect(() => { loadAll() }, [])

  const deleteUser = async (id) => {
    try {
      await api.delete(`/developer/users/${id}`)
      setConfirmDelete(null)
      loadAll()
      flash('User deleted successfully')
    } catch(e) { flash(e.response?.data?.detail || 'Error', 'error') }
  }

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/developer/users/${id}/role?role=${role}`)
      loadAll()
      flash(`Role changed to ${role}`)
    } catch(e) { flash('Error changing role', 'error') }
  }

  const updateFee = async () => {
    try {
      await api.patch('/developer/platform-fee', { platform_fee: parseFloat(newFee) })
      loadAll()
      flash(`Platform fee updated to ₹${newFee}`)
    } catch(e) { flash('Error updating fee', 'error') }
  }

  const markSettled = async (payment_id) => {
    try {
      await api.patch(`/developer/settlements/${payment_id}/mark-settled`)
      loadAll()
      flash('Marked as settled')
    } catch(e) { flash('Error', 'error') }
  }

  if (viewAs === 'student') return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 py-3"
        style={{background:'rgba(124,58,237,0.95)',backdropFilter:'blur(10px)'}}>
        <div className="text-white text-sm font-semibold">👁 Viewing as Student</div>
        <button onClick={() => setViewAs(null)}
          className="ml-auto bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-1.5 rounded-lg transition">
          Exit Preview
        </button>
      </div>
      <div className="pt-12"><StudentDashboard /></div>
    </div>
  )

  if (viewAs === 'teacher') return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 py-3"
        style={{background:'rgba(13,148,136,0.95)',backdropFilter:'blur(10px)'}}>
        <div className="text-white text-sm font-semibold">👁 Viewing as Teacher</div>
        <button onClick={() => setViewAs(null)}
          className="ml-auto bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-1.5 rounded-lg transition">
          Exit Preview
        </button>
      </div>
      <div className="pt-12"><TeacherDashboard /></div>
    </div>
  )

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const navItems = [
    ['overview','🖥','Overview'],
    ['users','👥','All Users'],
    ['settlements','💸','Settlements'],
    ['earnings','💰','My Earnings'],
    ['settings','⚙','Settings'],
  ]

  return (
    <div className="min-h-screen flex" style={{background:'#0a0a0f'}}>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{background:'rgba(0,0,0,0.8)',backdropFilter:'blur(8px)'}}>
          <div className="rounded-2xl p-8 max-w-sm w-full mx-4 animate-fade-up"
            style={{background:'#0f1117',border:'1px solid rgba(239,68,68,0.3)'}}>
            <div className="text-4xl text-center mb-4">⚠️</div>
            <div className="text-white font-semibold text-center mb-2">Delete User?</div>
            <div className="text-gray-400 text-sm text-center mb-6">
              This will permanently delete <strong className="text-white">{confirmDelete.name}</strong> and all their data.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 glass">Cancel</button>
              <button onClick={() => deleteUser(confirmDelete.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{background:'linear-gradient(135deg,#ef4444,#dc2626)'}}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-60 border-r border-white/5 flex flex-col shrink-0"
        style={{background:'rgba(10,10,15,0.98)'}}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{background:'linear-gradient(135deg,#7c3aed,#06b6d4)'}}>
              <span className="text-white font-bold text-sm">✦</span>
            </div>
            <div>
              <div className="font-display text-sm font-bold gradient-text">Learnly</div>
              <div className="text-xs text-gray-500">Developer Console</div>
            </div>
          </div>
          <div className="rounded-xl p-3 text-center"
            style={{background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.2)'}}>
            <div className="text-xs text-violet-400 font-semibold">🛡 Super Admin</div>
            <div className="text-xs text-gray-500 mt-0.5">{user?.name}</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(([key,icon,label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${tab===key?'active':''}`}
              style={tab!==key?{color:'#6b7280'}:{}}>
              <span style={{fontSize:15}}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5 space-y-2">
          <div className="text-xs text-gray-500 px-2 mb-2">Preview as:</div>
          <button onClick={() => setViewAs('student')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white glass transition">
            🎓 Student view
          </button>
          <button onClick={() => setViewAs('teacher')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white glass transition">
            👨‍🏫 Teacher view
          </button>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
            ⏻ Sign out
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 px-6 py-4 border-b border-white/5 flex items-center gap-4"
          style={{background:'rgba(10,10,15,0.9)',backdropFilter:'blur(20px)'}}>
          <div>
            <div className="font-semibold text-white capitalize">{tab}</div>
            <div className="text-xs text-gray-500">Learnly Developer Console</div>
          </div>
          {msg.text && (
            <div className={`ml-auto text-sm px-4 py-2 rounded-xl border animate-fade-in ${msg.type==='error'
              ?'bg-red-500/10 border-red-500/20 text-red-400'
              :'bg-violet-500/10 border-violet-500/20 text-violet-300'}`}>
              {msg.text}
            </div>
          )}
        </div>

        <div className="p-6">

          {tab==='overview' && stats && (
            <div className="animate-fade-up">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  {label:'Total users',value:stats.total_users,icon:'👥',color:'#8b5cf6'},
                  {label:'Students',value:stats.total_students,icon:'🎓',color:'#34d399'},
                  {label:'Teachers',value:stats.total_teachers,icon:'👨‍🏫',color:'#0d9488'},
                  {label:'Courses',value:stats.total_courses,icon:'📚',color:'#60a5fa'},
                ].map((s,i) => (
                  <div key={s.label} className={`stat-card rounded-2xl p-5 animate-fade-up delay-${(i+1)*100}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</div>
                      <div className="text-xl">{s.icon}</div>
                    </div>
                    <div className="text-3xl font-bold" style={{color:s.color}}>
                      <AnimatedCounter value={s.value}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  {label:'Total revenue',value:stats.total_revenue,prefix:'₹',icon:'💳',color:'#fbbf24'},
                  {label:'Platform earnings',value:stats.platform_earnings,prefix:'₹',icon:'💰',color:'#34d399'},
                  {label:'Certificates issued',value:stats.total_certificates,prefix:'',icon:'🏅',color:'#f87171'},
                ].map((s,i) => (
                  <div key={s.label} className="stat-card rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</div>
                      <div className="text-xl">{s.icon}</div>
                    </div>
                    <div className="text-3xl font-bold" style={{color:s.color}}>
                      {s.prefix}<AnimatedCounter value={s.value}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="glass rounded-2xl p-5 border border-white/5">
                <div className="text-sm font-semibold text-white mb-4">Recent registrations</div>
                <div className="space-y-2">
                  {stats.recent_users.map(u => (
                    <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{background:u.role==='teacher'?'rgba(13,148,136,0.3)':u.role==='developer'?'rgba(124,58,237,0.3)':'rgba(99,102,241,0.3)'}}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.role==='teacher'?'bg-teal-500/15 text-teal-400':
                        u.role==='developer'?'bg-violet-500/15 text-violet-400':
                        'bg-blue-500/15 text-blue-400'}`}>
                        {u.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==='users' && (
            <div className="animate-fade-up">
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 glass rounded-xl flex items-center gap-3 px-4 py-2.5 border border-white/5">
                  <span className="text-gray-500">🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600"/>
                </div>
                <div className="flex gap-2">
                  {['all','student','teacher','developer'].map(r => (
                    <button key={r} onClick={() => setRoleFilter(r)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition capitalize ${roleFilter===r?'btn-primary text-white':'glass text-gray-400 hover:text-white'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {filteredUsers.map((u,i) => (
                  <div key={u.id} className={`glass rounded-xl p-4 border border-white/5 flex items-center gap-4 animate-fade-up delay-${Math.min(i*50,400)}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{background:u.role==='teacher'?'linear-gradient(135deg,#0d9488,#0f766e)':u.role==='developer'?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#3b82f6,#2563eb)'}}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        Joined {new Date(u.created_at).toLocaleDateString()} · {u.enrollments} enrollments · ₹{u.total_spent} spent
                      </div>
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${
                      u.role==='teacher'?'bg-teal-500/15 text-teal-400':
                      u.role==='developer'?'bg-violet-500/15 text-violet-400':
                      'bg-blue-500/15 text-blue-400'}`}>
                      {u.role}
                    </div>
                    <select value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg outline-none shrink-0"
                      style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#9ca3af'}}>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="developer">Developer</option>
                    </select>
                    <button onClick={() => setConfirmDelete(u)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition shrink-0 text-sm">
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='settlements' && (
            <div className="animate-fade-up">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-lg font-semibold text-white">Teacher Settlements</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Pending: ₹{settlements.filter(s=>!s.teacher_paid).reduce((t,s)=>t+s.teacher_amount,0).toFixed(2)} · 
                    Settled: ₹{settlements.filter(s=>s.teacher_paid).reduce((t,s)=>t+s.teacher_amount,0).toFixed(2)}
                  </div>
                </div>
              </div>
              {settlements.length===0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">💸</div>
                  <div className="text-gray-400">No paid enrollments yet</div>
                </div>
              )}
              <div className="space-y-3">
                {settlements.map((s,i) => (
                  <div key={i} className={`glass rounded-xl p-5 border animate-fade-up ${s.teacher_paid?'border-green-500/20':'border-amber-500/20'}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-white">{s.course}</div>
                          <div className={`text-xs px-2 py-0.5 rounded-full ${s.teacher_paid?'bg-green-500/15 text-green-400':'bg-amber-500/15 text-amber-400'}`}>
                            {s.teacher_paid?'Settled':'Pending'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          Student: {s.student} · Teacher: {s.teacher}
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-gray-500">Total paid</div>
                            <div className="text-white font-medium">₹{s.total_amount}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Platform fee (yours)</div>
                            <div className="text-green-400 font-medium">₹{s.platform_fee}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Teacher's share</div>
                            <div className="text-amber-400 font-medium">₹{s.teacher_amount}</div>
                          </div>
                        </div>
                        {(s.teacher_upi || s.teacher_account) && (
                          <div className="mt-3 p-3 rounded-lg text-xs space-y-1"
                            style={{background:'rgba(255,255,255,0.04)'}}>
                            <div className="text-gray-500 font-medium mb-1">Pay teacher via:</div>
                            {s.teacher_upi && (
                              <div className="text-gray-300">UPI: <span className="text-violet-400">{s.teacher_upi}</span></div>
                            )}
                            {s.teacher_account && (
                              <div className="text-gray-300">
                                A/C: {s.teacher_account} · IFSC: {s.teacher_ifsc}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 mt-2">
                          {new Date(s.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                        </div>
                      </div>
                      {!s.teacher_paid && (
                        <button onClick={() => markSettled(s.payment_id)}
                          className="shrink-0 text-xs px-4 py-2 rounded-xl font-medium transition"
                          style={{background:'rgba(52,211,153,0.15)',color:'#34d399',border:'1px solid rgba(52,211,153,0.3)'}}>
                          Mark Settled
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='earnings' && earnings && (
            <div className="animate-fade-up">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  {label:'Total platform earnings',value:earnings.total_platform_earnings,color:'#34d399',prefix:'₹'},
                  {label:'Total transactions',value:earnings.transactions,color:'#8b5cf6',prefix:''},
                  {label:'Current fee per sale',value:platformFee,color:'#fbbf24',prefix:'₹'},
                ].map(s => (
                  <div key={s.label} className="stat-card rounded-2xl p-6">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{s.label}</div>
                    <div className="text-4xl font-bold" style={{color:s.color}}>
                      {s.prefix}<AnimatedCounter value={s.value}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="glass rounded-2xl p-6 border border-white/5">
                <div className="text-sm font-semibold text-white mb-4">Monthly platform earnings</div>
                {Object.keys(earnings.monthly).length===0 && (
                  <div className="text-gray-500 text-sm text-center py-8">No transactions yet</div>
                )}
                {Object.entries(earnings.monthly).map(([month,amount]) => {
                  const max = Math.max(...Object.values(earnings.monthly))
                  return (
                    <div key={month} className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>{month}</span><span className="text-green-400 font-medium">₹{amount}</span>
                      </div>
                      <div className="h-2 rounded-full" style={{background:'rgba(255,255,255,0.07)'}}>
                        <div className="h-2 rounded-full progress-bar"
                          style={{width:(amount/max*100)+'%',background:'linear-gradient(90deg,#34d399,#0d9488)'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab==='settings' && (
            <div className="animate-fade-up max-w-lg space-y-6">
              <div className="glass rounded-2xl p-6 border border-white/5">
                <div className="text-sm font-semibold text-white mb-1">Platform fee per enrollment</div>
                <div className="text-xs text-gray-400 mb-4">
                  This amount is deducted from every paid course enrollment and credited to your account. Currently ₹{platformFee} per sale.
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-2 block uppercase tracking-wide">New fee amount (₹)</label>
                    <input type="number" min="0" value={newFee}
                      onChange={e => setNewFee(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                      style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}
                      onFocus={e => e.target.style.border='1px solid rgba(124,58,237,0.6)'}
                      onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.1)'}/>
                  </div>
                  <button onClick={updateFee} className="btn-primary text-white px-6 py-3 rounded-xl text-sm font-semibold">
                    Update
                  </button>
                </div>
                <div className="mt-4 p-3 rounded-xl text-xs text-gray-400"
                  style={{background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.15)'}}>
                  <div className="font-medium text-violet-400 mb-1">💡 Example breakdown</div>
                  Student pays ₹500 → You get ₹{newFee||platformFee} → Teacher gets ₹{500-(newFee||platformFee)}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 border border-white/5">
                <div className="text-sm font-semibold text-white mb-1">Razorpay website approval</div>
                <div className="text-xs text-gray-400 mb-4">
                  To activate live payments and receive real money, submit your website URL to Razorpay for approval.
                </div>
                <div className="space-y-3 text-xs text-gray-300">
                  {[
                    ['1','Login to Razorpay Dashboard','dashboard.razorpay.com'],
                    ['2','Go to Settings → Business Profile','Fill company/individual details'],
                    ['3','Submit website URL','Your deployed site URL (Railway/Render)'],
                    ['4','Complete KYC','PAN card + bank account'],
                    ['5','Wait for approval','Usually 24-48 hours'],
                  ].map(([num,title,desc]) => (
                    <div key={num} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                        style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
                        {num}
                      </div>
                      <div>
                        <div className="text-white font-medium">{title}</div>
                        <div className="text-gray-500">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 border border-white/5">
                <div className="text-sm font-semibold text-white mb-4">Quick deploy to get a URL</div>
                <div className="space-y-3 text-xs">
                  {[
                    {name:'Railway',url:'railway.app',desc:'Free tier · Deploy in 2 mins · Best option'},
                    {name:'Render',url:'render.com',desc:'Free tier · Good for FastAPI backend'},
                    {name:'Vercel',url:'vercel.com',desc:'Free · Best for React frontend'},
                  ].map(s => (
                    <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{background:'rgba(255,255,255,0.04)'}}>
                      <div className="flex-1">
                        <div className="text-white font-medium">{s.name}</div>
                        <div className="text-gray-500">{s.desc}</div>
                      </div>
                      <a href={`https://${s.url}`} target="_blank" rel="noreferrer"
                        className="text-violet-400 hover:text-violet-300 transition">
                        Open ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
