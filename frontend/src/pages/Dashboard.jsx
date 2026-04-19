import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import CoursePlayer from './CoursePlayer'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('courses')
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [assessments, setAssessments] = useState([])
  const [certificates, setCertificates] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [msg, setMsg] = useState({ text:'', type:'success' })
  const [profile, setProfile] = useState({ name:'', email:'', role:'', created_at:'' })
  const [profileForm, setProfileForm] = useState({ name:'' })
  const [pwForm, setPwForm] = useState({ current_password:'', new_password:'', confirm:'' })
  const [adminTab, setAdminTab] = useState('users')
  const [allUsers, setAllUsers] = useState([])
  const [newCourse, setNewCourse] = useState({ title:'', description:'', instructor:'', total_modules:'' })
  const [assessForm, setAssessForm] = useState({ course_id:'', title:'', score:'', max_score:'100' })
  const [attendForm, setAttendForm] = useState({ course_id:'', present:true })
  const [expandedUser, setExpandedUser] = useState(null)
  const [playingCourse, setPlayingCourse] = useState(null)

  const flash = (text, type='success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text:'', type:'success' }), 3000)
  }

  const loadAll = () => {
    api.get('/courses/').then(r => setCourses(r.data))
    api.get('/enrollments/my').then(r => setEnrollments(r.data))
    api.get('/assessments/my').then(r => setAssessments(r.data))
    api.get('/certificates/my').then(r => setCertificates(r.data))
    api.get('/attendance/my').then(r => setAttendance(r.data))
    api.get('/users/me').then(r => {
      setProfile(r.data)
      setProfileForm({ name: r.data.name })
    })
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (tab === 'admin') {
      api.get('/users/all').then(r => setAllUsers(r.data)).catch(() => {})
    }
  }, [tab])

  const enroll = async (course_id) => {
    try {
      await api.post('/enrollments/', { course_id })
      loadAll()
      flash('Enrolled successfully!')
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error') }
  }

  const submitAssessment = async (e) => {
    e.preventDefault()
    try {
      await api.post('/assessments/', {
        course_id: parseInt(assessForm.course_id),
        title: assessForm.title,
        score: parseFloat(assessForm.score),
        max_score: parseFloat(assessForm.max_score)
      })
      setAssessForm({ course_id:'', title:'', score:'', max_score:'100' })
      loadAll()
      flash('Assessment submitted!')
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error') }
  }

  const markAttendance = async (e) => {
    e.preventDefault()
    try {
      await api.post('/attendance/', {
        course_id: parseInt(attendForm.course_id),
        present: attendForm.present
      })
      setAttendForm({ course_id:'', present:true })
      loadAll()
      flash('Attendance marked!')
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error') }
  }

  const issueCert = async (course_id) => {
    try {
      await api.post('/certificates/', { course_id })
      loadAll()
      flash('Certificate issued!')
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error') }
  }

  const createCourse = async (e) => {
    e.preventDefault()
    try {
      await api.post('/courses/', { ...newCourse, total_modules: parseInt(newCourse.total_modules)||0 })
      setNewCourse({ title:'', description:'', instructor:'', total_modules:'' })
      loadAll()
      flash('Course created!')
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error') }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    try {
      await api.patch('/users/me', { name: profileForm.name })
      loadAll()
      flash('Profile updated!')
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error') }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) {
      flash('Passwords do not match', 'error'); return
    }
    try {
      await api.patch('/users/me/password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      })
      setPwForm({ current_password:'', new_password:'', confirm:'' })
      flash('Password changed!')
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error') }
  }

  const avgScore = assessments.length
    ? Math.round(assessments.reduce((s,a) => s+a.percentage, 0) / assessments.length) : 0

  const ic = "w-full bg-[#252c42] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
  const lc = "text-xs text-gray-400 mb-1 block"
  const bc = "bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"

  const navItems = [
    ['courses','📚','Courses'],
    ['enrollments','📖','My Courses'],
    ['assessments','✏️','Assessments'],
    ['attendance','🕐','Attendance'],
    ['certificates','🏅','Certificates'],
    ['profile','👤','Profile'],
    ['admin','⚙️','Admin'],
  ]

  if (playingCourse) {
    return <CoursePlayer course={playingCourse} onBack={() => setPlayingCourse(null)} />
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      <div className="w-56 bg-[#181c27] border-r border-white/10 flex flex-col p-4 gap-1 shrink-0">
        <div className="text-lg font-semibold text-white px-2 py-3 mb-2">✦ Learnly</div>
        {navItems.map(([key,icon,label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${tab===key?'bg-violet-600/20 text-violet-400 font-medium':'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <span style={{fontSize:14}}>{icon}</span>{label}
          </button>
        ))}
        <div className="mt-auto border-t border-white/10 pt-3">
          <div className="text-xs text-gray-500 px-2 mb-0.5">{profile.name}</div>
          <div className="text-xs text-gray-600 px-2 mb-2">{profile.role}</div>
          <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 px-2">Sign out</button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {msg.text && (
          <div className={`mb-4 text-sm px-4 py-2 rounded-lg border ${msg.type==='error'?'bg-red-500/10 border-red-500/30 text-red-300':'bg-violet-500/10 border-violet-500/30 text-violet-300'}`}>
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            ['Enrolled', enrollments.length, 'text-violet-400'],
            ['Attendance', attendance ? attendance.rate+'%' : '—', 'text-green-400'],
            ['Avg Score', avgScore ? avgScore+'%' : '—', 'text-amber-400'],
            ['Certificates', certificates.length, 'text-blue-400'],
          ].map(([label,val,color]) => (
            <div key={label} className="bg-[#181c27] border border-white/10 rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</div>
              <div className={`text-2xl font-semibold ${color}`}>{val}</div>
            </div>
          ))}
        </div>

        {/* COURSES */}
        {tab === 'courses' && (
          <div>
            <div className="text-sm font-medium text-gray-400 mb-3">All available courses</div>
            {courses.length === 0 && <div className="text-gray-500 text-sm">No courses yet.</div>}
            <div className="grid grid-cols-2 gap-4">
              {courses.map(c => {
                const enrolled = enrollments.find(e => e.course_id === c.id)
                const hasCert = certificates.find(x => x.course === c.title)
                return (
                  <div key={c.id} className="bg-[#181c27] border border-white/10 rounded-xl p-5">
                    <div className="font-medium text-white mb-1">{c.title}</div>
                    <div className="text-xs text-gray-400 mb-1">{c.instructor} · {c.total_modules} modules</div>
                    <div className="text-xs text-gray-500 mb-4">{c.description}</div>
                    <div className="flex gap-2 flex-wrap">
                      {enrolled ? (
                        <>
                          <span className="text-xs text-green-400">✓ Enrolled · {enrolled.progress}% done</span>
                          <button
                            onClick={() => setPlayingCourse(enrolled)}
                            className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg transition">
                            ▶ Watch Videos
                          </button>
                        </>
                      ) : (
                        <button onClick={() => enroll(c.id)} className={bc}>Enroll</button>
                      )}
                      {enrolled && !hasCert && (
                        <button onClick={() => issueCert(c.id)}
                          className="text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 px-3 py-1.5 rounded-lg transition">
                          Issue Certificate
                        </button>
                      )}
                      {hasCert && <span className="text-xs text-amber-400">🏅 Certified</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* MY COURSES */}
        {tab === 'enrollments' && (
          <div>
            <div className="text-sm font-medium text-gray-400 mb-3">My enrolled courses</div>
            {enrollments.length === 0 && <div className="text-gray-500 text-sm">Not enrolled in any course yet.</div>}
            <div className="flex flex-col gap-4">
              {enrollments.map(e => (
                <div key={e.enrollment_id} className="bg-[#181c27] border border-white/10 rounded-xl p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="font-medium text-white">{e.course_title}</div>
                      <div className="text-xs text-gray-400">{e.instructor} · {e.total_modules} modules</div>
                    </div>
                    <button onClick={() => setPlayingCourse(e)}
                      className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg transition">
                      ▶ Watch
                    </button>
                    <div className={`text-sm font-semibold px-3 py-1 rounded-full ${e.progress===100?'bg-green-500/10 text-green-400':e.progress>=50?'bg-violet-500/10 text-violet-400':'bg-white/5 text-gray-400'}`}>
                      {e.progress===100?'✓ Complete':e.progress+'% done'}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="h-2 bg-white/10 rounded-full">
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{width:e.progress+'%', background:e.progress===100?'#22c55e':e.progress>=50?'#7c3aed':'#6366f1'}}>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                  </div>
                  {e.total_modules > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2">
                        Modules: {Math.round(e.progress/100*e.total_modules)} / {e.total_modules} completed
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {Array.from({length:e.total_modules}).map((_,i) => (
                          <div key={i} className={`w-5 h-5 rounded text-xs flex items-center justify-center transition-all ${i<Math.round(e.progress/100*e.total_modules)?'bg-violet-500 text-white':'bg-white/5 text-gray-600'}`}>
                            {i<Math.round(e.progress/100*e.total_modules)?'✓':''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-white/5 pt-4">
                    <div className="text-xs text-gray-500 mb-2">Update progress</div>
                    <div className="flex items-center gap-3">
                      <input type="range" min="0" max="100" step="5"
                        defaultValue={e.progress} className="flex-1 accent-violet-500"
                        onMouseUp={async (ev) => {
                          const val = parseFloat(ev.target.value)
                          try {
                            await api.patch(`/enrollments/${e.enrollment_id}/progress`, { progress: val })
                            loadAll(); flash(`Progress updated to ${val}%`)
                          } catch { flash('Failed to update', 'error') }
                        }}
                      />
                      <div className="flex gap-2">
                        {[25,50,75,100].map(pct => (
                          <button key={pct}
                            onClick={async () => {
                              try {
                                await api.patch(`/enrollments/${e.enrollment_id}/progress`, { progress: pct })
                                loadAll(); flash(`Progress updated to ${pct}%`)
                              } catch { flash('Failed', 'error') }
                            }}
                            className={`text-xs px-2 py-1 rounded transition ${e.progress>=pct?'bg-violet-600 text-white':'bg-white/5 text-gray-400 hover:text-white'}`}>
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ASSESSMENTS */}
        {tab === 'assessments' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#181c27] border border-white/10 rounded-xl p-5">
              <div className="text-sm font-medium text-white mb-4">Submit an assessment</div>
              <form onSubmit={submitAssessment} className="space-y-3">
                <div>
                  <label className={lc}>Course</label>
                  <select required value={assessForm.course_id}
                    onChange={e => setAssessForm({...assessForm, course_id:e.target.value})} className={ic}>
                    <option value="">Select course</option>
                    {enrollments.map(e => <option key={e.course_id} value={e.course_id}>{e.course_title}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>Title</label>
                  <input required value={assessForm.title}
                    onChange={e => setAssessForm({...assessForm, title:e.target.value})}
                    className={ic} placeholder="Quiz 1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lc}>Score</label>
                    <input required type="number" min="0" value={assessForm.score}
                      onChange={e => setAssessForm({...assessForm, score:e.target.value})}
                      className={ic} placeholder="85" />
                  </div>
                  <div>
                    <label className={lc}>Out of</label>
                    <input required type="number" min="1" value={assessForm.max_score}
                      onChange={e => setAssessForm({...assessForm, max_score:e.target.value})}
                      className={ic} placeholder="100" />
                  </div>
                </div>
                <button type="submit" className={bc+' w-full'}>Submit</button>
              </form>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400 mb-3">My results</div>
              {assessments.length===0 && <div className="text-gray-500 text-sm">No assessments yet.</div>}
              <div className="flex flex-col gap-3">
                {assessments.map(a => (
                  <div key={a.id} className="bg-[#181c27] border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{a.title}</div>
                      <div className="text-xs text-gray-400">{a.course}</div>
                    </div>
                    <div className={`text-lg font-semibold ${a.percentage>=75?'text-green-400':a.percentage>=50?'text-amber-400':'text-red-400'}`}>
                      {a.percentage}%
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${a.percentage>=50?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>
                      {a.percentage>=50?'Passed':'Failed'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE */}
        {tab === 'attendance' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#181c27] border border-white/10 rounded-xl p-5">
              <div className="text-sm font-medium text-white mb-4">Mark attendance</div>
              <form onSubmit={markAttendance} className="space-y-3">
                <div>
                  <label className={lc}>Course</label>
                  <select required value={attendForm.course_id}
                    onChange={e => setAttendForm({...attendForm, course_id:e.target.value})} className={ic}>
                    <option value="">Select course</option>
                    {enrollments.map(e => <option key={e.course_id} value={e.course_id}>{e.course_title}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>Status</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setAttendForm({...attendForm, present:true})}
                      className={`flex-1 py-2 rounded-lg text-sm transition ${attendForm.present?'bg-green-600 text-white':'bg-white/5 text-gray-400'}`}>
                      Present
                    </button>
                    <button type="button" onClick={() => setAttendForm({...attendForm, present:false})}
                      className={`flex-1 py-2 rounded-lg text-sm transition ${!attendForm.present?'bg-red-600 text-white':'bg-white/5 text-gray-400'}`}>
                      Absent
                    </button>
                  </div>
                </div>
                <button type="submit" className={bc+' w-full'}>Mark</button>
              </form>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400 mb-3">Summary</div>
              {!attendance||attendance.total===0
                ? <div className="text-gray-500 text-sm">No records yet.</div>
                : (
                  <div className="bg-[#181c27] border border-white/10 rounded-xl p-6">
                    <div className={`text-5xl font-semibold mb-2 ${attendance.rate>=75?'text-green-400':'text-amber-400'}`}>
                      {attendance.rate}%
                    </div>
                    <div className="text-sm text-gray-400 mb-4">
                      {attendance.present} present · {attendance.total-attendance.present} absent · {attendance.total} total
                    </div>
                    <div className="h-2 bg-white/10 rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{width:attendance.rate+'%'}}></div>
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* CERTIFICATES */}
        {tab === 'certificates' && (
          <div>
            <div className="text-sm font-medium text-gray-400 mb-3">My certificates</div>
            {certificates.length===0 && <div className="text-gray-500 text-sm">No certificates yet.</div>}
            <div className="grid grid-cols-2 gap-4">
              {certificates.map(c => (
                <div key={c.id} className="bg-[#181c27] border border-amber-500/20 rounded-xl p-6">
                  <div className="text-3xl mb-3">🏅</div>
                  <div className="font-medium text-white mb-1">{c.course}</div>
                  <div className="text-xs text-gray-400 mb-3">
                    Issued {new Date(c.issued_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-xs text-green-400">Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div className="max-w-lg">
            <div className="text-sm font-medium text-gray-400 mb-4">My profile</div>
            <div className="bg-[#181c27] border border-white/10 rounded-xl p-5 flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-violet-600/30 flex items-center justify-center text-xl font-semibold text-violet-300">
                {profile.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-white">{profile.name}</div>
                <div className="text-sm text-gray-400">{profile.email}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN',{month:'long',year:'numeric'}) : '—'}
                </div>
              </div>
              <div className="ml-auto text-xs bg-violet-600/20 text-violet-400 px-2 py-1 rounded">{profile.role}</div>
            </div>
            <div className="bg-[#181c27] border border-white/10 rounded-xl p-5 mb-4">
              <div className="text-sm font-medium text-white mb-3">Edit name</div>
              <form onSubmit={saveProfile} className="space-y-3">
                <div>
                  <label className={lc}>Full name</label>
                  <input required value={profileForm.name}
                    onChange={e => setProfileForm({...profileForm, name:e.target.value})}
                    className={ic} placeholder="Your name" />
                </div>
                <button type="submit" className={bc}>Save changes</button>
              </form>
            </div>
            <div className="bg-[#181c27] border border-white/10 rounded-xl p-5">
              <div className="text-sm font-medium text-white mb-3">Change password</div>
              <form onSubmit={changePassword} className="space-y-3">
                <div>
                  <label className={lc}>Current password</label>
                  <input required type="password" value={pwForm.current_password}
                    onChange={e => setPwForm({...pwForm, current_password:e.target.value})}
                    className={ic} placeholder="••••••••" />
                </div>
                <div>
                  <label className={lc}>New password</label>
                  <input required type="password" value={pwForm.new_password}
                    onChange={e => setPwForm({...pwForm, new_password:e.target.value})}
                    className={ic} placeholder="••••••••" />
                </div>
                <div>
                  <label className={lc}>Confirm new password</label>
                  <input required type="password" value={pwForm.confirm}
                    onChange={e => setPwForm({...pwForm, confirm:e.target.value})}
                    className={ic} placeholder="••••••••" />
                </div>
                <button type="submit" className={bc}>Change password</button>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN */}
        {tab === 'admin' && (
          <div>
            <div className="flex gap-3 mb-5">
              {[['users','All Users'],['add-course','Add Course']].map(([t,label]) => (
                <button key={t} onClick={() => setAdminTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition ${adminTab===t?'bg-violet-600 text-white':'bg-white/5 text-gray-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
            {adminTab === 'users' && (
              <div>
                <div className="text-sm text-gray-400 mb-3">{allUsers.length} registered users</div>
                <div className="flex flex-col gap-3">
                  {allUsers.map(u => (
                    <div key={u.id} className="bg-[#181c27] border border-white/10 rounded-xl overflow-hidden">
                      <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition"
                        onClick={() => setExpandedUser(expandedUser===u.id?null:u.id)}>
                        <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-medium text-violet-300">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{u.name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="bg-white/5 px-2 py-1 rounded">{u.role}</span>
                          <span>{u.enrollments?.length||0} courses</span>
                          <span className={u.avg_score>=75?'text-green-400':u.avg_score>=50?'text-amber-400':'text-gray-400'}>{u.avg_score}% avg</span>
                          <span className={u.attendance_rate>=75?'text-green-400':'text-amber-400'}>{u.attendance_rate}% att</span>
                          <span className="text-amber-400">🏅 {u.certificates}</span>
                          <span className="text-gray-600">{expandedUser===u.id?'▲':'▼'}</span>
                        </div>
                      </div>
                      {expandedUser===u.id && (
                        <div className="border-t border-white/5 p-4 bg-[#0f1117]">
                          <div className="text-xs text-gray-500 mb-2">Enrolled courses</div>
                          {u.enrollments?.length===0
                            ? <div className="text-xs text-gray-600">No enrollments</div>
                            : u.enrollments?.map((e,i) => (
                              <div key={i} className="flex items-center gap-3 mb-2">
                                <div className="flex-1 text-xs text-gray-300">{e.course_title}</div>
                                <div className="w-32 h-1.5 bg-white/10 rounded-full">
                                  <div className="h-1.5 bg-violet-500 rounded-full" style={{width:e.progress+'%'}}></div>
                                </div>
                                <div className="text-xs text-gray-400 w-10 text-right">{e.progress}%</div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {adminTab === 'add-course' && (
              <div className="max-w-md">
                <form onSubmit={createCourse} className="bg-[#181c27] border border-white/10 rounded-xl p-5 space-y-3 mb-5">
                  <div className="text-sm font-medium text-white mb-1">Create new course</div>
                  <div><label className={lc}>Title</label>
                    <input required value={newCourse.title} onChange={e => setNewCourse({...newCourse,title:e.target.value})} className={ic} placeholder="Python for Beginners" /></div>
                  <div><label className={lc}>Description</label>
                    <input value={newCourse.description} onChange={e => setNewCourse({...newCourse,description:e.target.value})} className={ic} placeholder="Short description" /></div>
                  <div><label className={lc}>Instructor</label>
                    <input value={newCourse.instructor} onChange={e => setNewCourse({...newCourse,instructor:e.target.value})} className={ic} placeholder="Dr. Someone" /></div>
                  <div><label className={lc}>Total modules</label>
                    <input type="number" value={newCourse.total_modules} onChange={e => setNewCourse({...newCourse,total_modules:e.target.value})} className={ic} placeholder="10" /></div>
                  <button type="submit" className={bc+' w-full'}>Create Course</button>
                </form>
                <div className="text-sm text-gray-400 mb-3">Existing courses ({courses.length})</div>
                <div className="flex flex-col gap-2">
                  {courses.map(c => (
                    <div key={c.id} className="bg-[#181c27] border border-white/10 rounded-lg p-3">
                      <div className="text-sm text-white">{c.title}</div>
                      <div className="text-xs text-gray-400">{c.instructor} · {c.total_modules} modules</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}