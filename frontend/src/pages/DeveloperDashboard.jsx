import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import AnimatedCounter from '../components/AnimatedCounter'
import MobileLayout from '../components/MobileLayout'
import Logo from '../components/Logo'
import StudentDashboard from './StudentDashboard'
import TeacherDashboard from './TeacherDashboard'

const bottomNav = [
  ['overview','🖥','Overview'],
  ['users','👥','Users'],
  ['settlements','💸','Pay'],
  ['earnings','💰','Earnings'],
  ['settings','⚙','Settings'],
]

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
      const [s,u,se,e,f] = await Promise.all([
        api.get('/developer/stats'),
        api.get('/developer/users'),
        api.get('/developer/settlements'),
        api.get('/developer/platform-earnings'),
        api.get('/developer/platform-fee')
      ])
      setStats(s.data); setUsers(u.data); setSettlements(se.data)
      setEarnings(e.data); setPlatformFee(f.data.platform_fee)
      setNewFee(String(f.data.platform_fee))
    } catch(e) { flash('Failed to load','error') }
  }

  useEffect(() => { loadAll() }, [])

  const deleteUser = async (id) => {
    try {
      await api.delete(`/developer/users/${id}`)
      setConfirmDelete(null); loadAll()
      flash('User deleted')
    } catch(e) { flash(e.response?.data?.detail||'Error','error') }
  }

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/developer/users/${id}/role?role=${role}`)
      loadAll(); flash(`Role → ${role}`)
    } catch { flash('Error','error') }
  }

  const updateFee = async () => {
    try {
      await api.patch('/developer/platform-fee', { platform_fee: parseFloat(newFee) })
      loadAll(); flash(`Fee updated to ₹${newFee}`)
    } catch { flash('Error','error') }
  }

  const markSettled = async (id) => {
    try {
      await api.patch(`/developer/settlements/${id}/mark-settled`)
      loadAll(); flash('Marked settled')
    } catch { flash('Error','error') }
  }

  if (viewAs==='student') return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-4 py-2.5"
        style={{background:'rgba(124,58,237,0.95)',backdropFilter:'blur(10px)'}}>
        <span className="text-white text-sm font-semibold">👁 Student preview</span>
        <button onClick={()=>setViewAs(null)}
          className="ml-auto bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-1.5 rounded-xl transition">
          ✕ Exit
        </button>
      </div>
      <div className="pt-10"><StudentDashboard/></div>
    </div>
  )

  if (viewAs==='teacher') return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-4 py-2.5"
        style={{background:'rgba(13,148,136,0.95)',backdropFilter:'blur(10px)'}}>
        <span className="text-white text-sm font-semibold">👁 Teacher preview</span>
        <button onClick={()=>setViewAs(null)}
          className="ml-auto bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-1.5 rounded-xl transition">
          ✕ Exit
        </button>
      </div>
      <div className="pt-10"><TeacherDashboard/></div>
    </div>
  )

  const filteredUsers = users.filter(u => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const mr = roleFilter==='all' || u.role===roleFilter
    return ms && mr
  })

  const sidebarContent = ({ closeSidebar }) => (
    <>
      <div className="p-5 border-b" style={{borderColor:'rgba(255,255,255,0.06)'}}>
        <Logo size={36} textSize="text-lg"/>
        <div className="mt-3 px-3 py-2 rounded-xl text-center"
          style={{background:'rgba(124,58,237,0.12)',border:'1px solid rgba(124,58,237,0.2)'}}>
          <div className="text-xs font-bold" style={{color:'#a78bfa'}}>🛡 Developer Console</div>
          <div className="text-xs mt-0.5 truncate" style={{color:'var(--text3)'}}>{user?.email}</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {bottomNav.map(([key,icon,label]) => (
          <button key={key} onClick={()=>{setTab(key);closeSidebar()}}
            className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all ${tab===key?'active':''}`}
            style={tab!==key?{color:'var(--text3)'}:{}}>
            <span style={{fontSize:16}}>{icon}</span><span>{label}</span>
          </button>
        ))}
        <div className="pt-3 mt-3 border-t" style={{borderColor:'rgba(255,255,255,0.06)'}}>
          <div className="text-xs px-3 mb-2" style={{color:'var(--text3)'}}>Preview as</div>
          {[['student','🎓 Student view'],['teacher','👨‍🏫 Teacher view']].map(([role,label]) => (
            <button key={role} onClick={()=>{setViewAs(role);closeSidebar()}}
              className="btn-ghost w-full text-left px-3 py-2 rounded-xl text-xs mb-1 transition"
              style={{color:'var(--text2)'}}>
              {label}
            </button>
          ))}
        </div>
      </nav>
      <div className="p-3 border-t" style={{borderColor:'rgba(255,255,255,0.06)'}}>
        <div className="flex items-center gap-3 p-3 rounded-xl mb-2 glass">
          <div className="w-8 h-8 rounded-xl btn-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs badge-role-dev px-1.5 py-0.5 rounded-md inline-block mt-0.5">Developer</div>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition">
          ⏻ Sign out
        </button>
      </div>
    </>
  )

  const msgBar = msg.text ? (
    <div className={`text-xs px-3 py-1.5 rounded-xl border animate-fade-in hidden sm:block ${msg.type==='error'?'bg-red-500/10 border-red-500/20 text-red-400':'bg-violet-500/10 border-violet-500/20 text-violet-300'}`}>
      {msg.text}
    </div>
  ) : null

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)'}}>
          <div className="card-base animate-scale-in p-8 max-w-sm w-full text-center"
            style={{background:'#0d0d1a'}}>
            <div className="text-5xl mb-4">⚠️</div>
            <div className="text-white font-semibold mb-2">Delete {confirmDelete.name}?</div>
            <div className="text-sm mb-6" style={{color:'var(--text2)'}}>
              This permanently deletes the user and all their data. This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmDelete(null)}
                className="flex-1 btn-ghost text-white py-2.5 rounded-2xl text-sm">Cancel</button>
              <button onClick={()=>deleteUser(confirmDelete.id)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white"
                style={{background:'linear-gradient(135deg,#ef4444,#dc2626)'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {msg.text && (
        <div className={`fixed bottom-20 left-4 right-4 z-40 sm:hidden text-sm px-4 py-3 rounded-2xl border animate-fade-up ${msg.type==='error'?'bg-red-500/10 border-red-500/20 text-red-400':'bg-violet-500/10 border-violet-500/20 text-violet-300'}`}>
          {msg.text}
        </div>
      )}

      <MobileLayout
        sidebar={sidebarContent}
        topbarTitle={bottomNav.find(([k])=>k===tab)?.[2]||tab}
        topbarSub="Developer Console"
        msgBar={msgBar}
        bottomNavItems={bottomNav}
        activeTab={tab}
        onTabChange={setTab}>

        <div className="p-4 sm:p-6">

          {tab==='overview' && stats && (
            <div className="animate-fade-up space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {label:'Users',value:stats.total_users,icon:'👥',color:'#a78bfa'},
                  {label:'Students',value:stats.total_students,icon:'🎓',color:'#34d399'},
                  {label:'Teachers',value:stats.total_teachers,icon:'👨‍🏫',color:'#2dd4bf'},
                  {label:'Courses',value:stats.total_courses,icon:'📚',color:'#60a5fa'},
                ].map((s,i) => (
                  <div key={s.label} className={`stat-card rounded-2xl p-4 animate-fade-up delay-${(i+1)*100}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs uppercase tracking-wider" style={{color:'var(--text3)'}}>{s.label}</div>
                      <div className="text-lg">{s.icon}</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold" style={{color:s.color}}>
                      <AnimatedCounter value={s.value}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {label:'Total Revenue',value:stats.total_revenue,prefix:'₹',color:'#fbbf24',icon:'💳'},
                  {label:'My Earnings',value:stats.platform_earnings,prefix:'₹',color:'#34d399',icon:'💰'},
                  {label:'Certificates',value:stats.total_certificates,prefix:'',color:'#f87171',icon:'🏅'},
                ].map((s,i) => (
                  <div key={s.label} className="stat-card rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs uppercase tracking-wider" style={{color:'var(--text3)'}}>{s.label}</div>
                      <div className="text-lg">{s.icon}</div>
                    </div>
                    <div className="text-2xl font-bold" style={{color:s.color}}>
                      {s.prefix}<AnimatedCounter value={s.value}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-base p-5">
                <div className="text-sm font-semibold text-white mb-4">Recent registrations</div>
                <div className="space-y-2">
                  {stats.recent_users.map(u => (
                    <div key={u.id} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                      style={{borderColor:'rgba(255,255,255,0.05)'}}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{background:u.role==='teacher'?'rgba(13,148,136,0.3)':u.role==='developer'?'rgba(124,58,237,0.3)':'rgba(99,102,241,0.3)'}}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{u.name}</div>
                        <div className="text-xs truncate" style={{color:'var(--text3)'}}>{u.email}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${u.role==='teacher'?'badge-role-teacher':u.role==='developer'?'badge-role-dev':'badge-role-student'}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==='users' && (
            <div className="animate-fade-up space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="glass-strong rounded-2xl flex items-center gap-3 px-4 py-3 flex-1">
                  <span style={{color:'var(--text3)'}}>🔍</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600"/>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {['all','student','teacher','developer'].map(r => (
                    <button key={r} onClick={()=>setRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 capitalize ${roleFilter===r?'btn-primary text-white':'btn-ghost text-white/60'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {filteredUsers.map((u,i) => (
                  <div key={u.id} className={`card-base p-4 flex items-center gap-3 animate-fade-up delay-${Math.min(i*50,300)}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{background:u.role==='teacher'?'linear-gradient(135deg,#0d9488,#0f766e)':u.role==='developer'?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#3b82f6,#2563eb)'}}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">{u.name}</div>
                      <div className="text-xs truncate" style={{color:'var(--text3)'}}>{u.email}</div>
                      <div className="text-xs mt-0.5" style={{color:'var(--text3)'}}>
                        {u.enrollments} enrolled · ₹{u.total_spent} spent
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select value={u.role} onChange={e=>changeRole(u.id,e.target.value)}
                        className="text-xs px-2 py-1.5 rounded-xl outline-none hidden sm:block"
                        style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'var(--text2)'}}>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="developer">Developer</option>
                      </select>
                      <button onClick={()=>setConfirmDelete(u)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/10 transition text-sm">
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='settlements' && (
            <div className="animate-fade-up space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="card-base p-4">
                  <div className="text-xs mb-1" style={{color:'var(--text3)'}}>Pending payouts</div>
                  <div className="text-2xl font-bold text-amber-400">
                    ₹{settlements.filter(s=>!s.teacher_paid).reduce((t,s)=>t+s.teacher_amount,0).toFixed(0)}
                  </div>
                </div>
                <div className="card-base p-4">
                  <div className="text-xs mb-1" style={{color:'var(--text3)'}}>Total settled</div>
                  <div className="text-2xl font-bold text-green-400">
                    ₹{settlements.filter(s=>s.teacher_paid).reduce((t,s)=>t+s.teacher_amount,0).toFixed(0)}
                  </div>
                </div>
              </div>
              {settlements.length===0 && (
                <div className="card-base p-10 text-center">
                  <div className="text-4xl mb-2">💸</div>
                  <div className="text-sm" style={{color:'var(--text3)'}}>No transactions yet</div>
                </div>
              )}
              <div className="space-y-3">
                {settlements.map((s,i) => (
                  <div key={i} className={`card-base p-4 border ${s.teacher_paid?'border-green-500/15':'border-amber-500/15'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">{s.course}</div>
                        <div className="text-xs mt-0.5" style={{color:'var(--text3)'}}>
                          {s.student} → {s.teacher}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-xl font-medium shrink-0 ${s.teacher_paid?'badge-free':'badge-paid'}`}>
                        {s.teacher_paid?'Settled':'Pending'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div className="card-base p-2 text-center">
                        <div style={{color:'var(--text3)'}}>Total</div>
                        <div className="text-white font-semibold">₹{s.total_amount}</div>
                      </div>
                      <div className="card-base p-2 text-center">
                        <div style={{color:'var(--text3)'}}>Your fee</div>
                        <div className="text-green-400 font-semibold">₹{s.platform_fee}</div>
                      </div>
                      <div className="card-base p-2 text-center">
                        <div style={{color:'var(--text3)'}}>Teacher</div>
                        <div className="text-amber-400 font-semibold">₹{s.teacher_amount}</div>
                      </div>
                    </div>
                    {(s.teacher_upi||s.teacher_account) && (
                      <div className="text-xs p-3 rounded-xl mb-3"
                        style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                        {s.teacher_upi && <div style={{color:'var(--text2)'}}>UPI: <span style={{color:'#a78bfa'}}>{s.teacher_upi}</span></div>}
                        {s.teacher_account && <div style={{color:'var(--text2)'}}>A/C: {s.teacher_account} · {s.teacher_ifsc}</div>}
                      </div>
                    )}
                    {!s.teacher_paid && (
                      <button onClick={()=>markSettled(s.payment_id)}
                        className="w-full py-2 rounded-xl text-xs font-semibold transition"
                        style={{background:'rgba(52,211,153,0.12)',color:'#34d399',border:'1px solid rgba(52,211,153,0.25)'}}>
                        ✓ Mark as Settled
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='earnings' && earnings && (
            <div className="animate-fade-up space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {label:'Total platform earnings',value:earnings.total_platform_earnings,color:'#34d399',prefix:'₹'},
                  {label:'Total transactions',value:earnings.transactions,color:'#a78bfa',prefix:''},
                  {label:'Fee per enrollment',value:platformFee,color:'#fbbf24',prefix:'₹'},
                ].map(s => (
                  <div key={s.label} className="stat-card rounded-2xl p-5">
                    <div className="text-xs uppercase tracking-wider mb-2" style={{color:'var(--text3)'}}>{s.label}</div>
                    <div className="text-3xl font-bold" style={{color:s.color}}>
                      {s.prefix}<AnimatedCounter value={s.value}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-base p-5">
                <div className="text-sm font-semibold text-white mb-4">Monthly earnings</div>
                {Object.keys(earnings.monthly).length===0 && (
                  <div className="text-center py-6 text-sm" style={{color:'var(--text3)'}}>No transactions yet</div>
                )}
                {Object.entries(earnings.monthly).map(([month,amount]) => {
                  const max = Math.max(...Object.values(earnings.monthly))
                  return (
                    <div key={month} className="mb-4">
                      <div className="flex justify-between text-xs mb-2" style={{color:'var(--text2)'}}>
                        <span>{month}</span>
                        <span className="text-green-400 font-medium">₹{amount}</span>
                      </div>
                      <div className="progress-track h-2">
                        <div className="progress-fill h-2" style={{width:(amount/max*100)+'%',background:'linear-gradient(90deg,#34d399,#0d9488)'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab==='settings' && (
            <div className="animate-fade-up space-y-4 max-w-lg">
              <div className="card-base p-5">
                <div className="text-sm font-semibold text-white mb-1">Platform fee per enrollment</div>
                <div className="text-xs mb-4" style={{color:'var(--text3)'}}>
                  Currently ₹{platformFee} per paid enrollment. Change anytime.
                </div>
                <div className="flex gap-3">
                  <input type="number" min="0" value={newFee}
                    onChange={e=>setNewFee(e.target.value)}
                    className="input-base flex-1" placeholder="Amount in ₹"/>
                  <button onClick={updateFee}
                    className="btn-primary text-white px-5 py-3 rounded-2xl text-sm font-semibold shrink-0">
                    Update
                  </button>
                </div>
                <div className="mt-3 p-3 rounded-2xl text-xs" style={{background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.15)'}}>
                  <div className="font-medium mb-1" style={{color:'#a78bfa'}}>💡 Example</div>
                  <div style={{color:'var(--text2)'}}>
                    Student pays ₹500 → You get ₹{newFee||platformFee} → Teacher gets ₹{500-(newFee||platformFee)}
                  </div>
                </div>
              </div>

              <div className="card-base p-5">
                <div className="text-sm font-semibold text-white mb-1">Razorpay live approval</div>
                <div className="text-xs mb-4" style={{color:'var(--text3)'}}>Steps to activate real payments</div>
                <div className="space-y-3">
                  {[
                    ['1','Login to Razorpay','dashboard.razorpay.com'],
                    ['2','Complete KYC','PAN + bank account details'],
                    ['3','Submit website URL','Your Vercel URL'],
                    ['4','Wait for approval','Usually 24-48 hours'],
                    ['5','Get live keys','Update on Render environment'],
                  ].map(([num,title,desc]) => (
                    <div key={num} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full btn-primary flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                        {num}
                      </div>
                      <div>
                        <div className="text-sm text-white">{title}</div>
                        <div className="text-xs" style={{color:'var(--text3)'}}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-base p-5">
                <div className="text-sm font-semibold text-white mb-3">Quick links</div>
                {[
                  {name:'Razorpay Dashboard',url:'https://dashboard.razorpay.com',icon:'💳'},
                  {name:'Render Dashboard',url:'https://dashboard.render.com',icon:'🖥'},
                  {name:'Vercel Dashboard',url:'https://vercel.com/dashboard',icon:'⚡'},
                  {name:'GitHub Repo',url:'https://github.com',icon:'🐙'},
                ].map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl mb-2 btn-ghost transition">
                    <span>{s.icon}</span>
                    <span className="text-sm" style={{color:'var(--text2)'}}>{s.name}</span>
                    <span className="ml-auto text-xs" style={{color:'var(--text3)'}}>↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </MobileLayout>
    </>
  )
}