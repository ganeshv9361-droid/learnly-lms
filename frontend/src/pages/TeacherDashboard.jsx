import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import RevenueTab from '../components/RevenueTab'
import PayoutTab from '../components/PayoutTab'
import ProfileTab from '../components/ProfileTab'

export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('overview')
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [showMore, setShowMore] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: 'success' })

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    instructor: '',
    total_modules: '',
    is_paid: false,
    price: '',
  })

  const flash = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  const loadAll = () => {
    api.get('/teacher/students').then(r => setStudents(r.data)).catch(() => setStudents([]))
    api.get('/courses/').then(r => setCourses(r.data)).catch(() => setCourses([]))
  }

  useEffect(() => {
    loadAll()
  }, [])

  const createCourse = async e => {
    e.preventDefault()
    try {
      await api.post('/courses/', {
        ...newCourse,
        total_modules: parseInt(newCourse.total_modules) || 0,
        price: parseFloat(newCourse.price) || 0,
      })
      setNewCourse({
        title: '',
        description: '',
        instructor: '',
        total_modules: '',
        is_paid: false,
        price: '',
      })
      loadAll()
      flash('Course created successfully!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error creating course', 'error')
    }
  }

  const deleteCourse = async id => {
    if (!confirm('Delete this course?')) return
    try {
      await api.delete(`/courses/${id}`)
      loadAll()
      flash('Course deleted')
    } catch {
      flash('Error deleting course', 'error')
    }
  }

  const totalStudents = students.length
  const avgAttendance = students.length
    ? Math.round(students.reduce((s, st) => s + (st.attendance_rate || 0), 0) / students.length)
    : 0
  const certs = students.reduce((s, st) => s + (st.certificates || 0), 0)

  const StatCard = ({ icon, title, value, sub, color }) => (
    <div className="rounded-3xl p-5 bg-white/[0.055] border border-white/10 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-gray-400 text-xs tracking-widest uppercase">{title}</div>
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="text-xs text-gray-400 mt-1">{sub}</div>
        </div>
      </div>
    </div>
  )

  const BottomBtn = ({ id, icon, label }) => (
    <button
      onClick={() => {
        setTab(id)
        setShowMore(false)
      }}
      className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-2xl text-xs transition ${
        tab === id ? 'bg-violet-500/20 text-violet-400' : 'text-gray-400'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-[#070b16] text-white pb-28">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.35),transparent_35%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.25),transparent_35%),linear-gradient(135deg,#070b16,#0b1020,#070712)]" />

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="text-3xl text-gray-300">☰</button>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-3xl">🎓</div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Learnly
                </h1>
              </div>
              <p className="text-sm text-gray-400 ml-11">Teacher Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-2xl">
              🔔
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-500" />
            </button>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center font-bold text-xl">
              {user?.name?.[0]?.toUpperCase() || 'T'}
            </div>
          </div>
        </div>

        {msg.text && (
          <div className={`mb-4 px-4 py-3 rounded-2xl border text-sm ${
            msg.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-green-500/10 border-green-500/30 text-green-400'
          }`}>
            {msg.text}
          </div>
        )}

        {tab === 'overview' && (
          <>
            <div className="rounded-3xl p-6 mb-5 bg-white/[0.055] border border-white/10 backdrop-blur-xl shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-4xl">
                  👤
                </div>
                <div>
                  <p className="text-gray-300">Welcome back,</p>
                  <h2 className="text-2xl font-bold">{user?.name || 'Teacher'} 👋</h2>
                  <p className="text-sm text-gray-400">Here&apos;s what&apos;s happening today</p>
                </div>
              </div>
              <div className="hidden sm:block text-gray-400 text-sm">
                📅 {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <StatCard icon="👥" title="Students" value={totalStudents} sub="Total enrolled students" color="bg-violet-500/20 text-violet-300" />
              <StatCard icon="📖" title="Courses" value={courses.length} sub="Total courses created" color="bg-cyan-500/20 text-cyan-300" />
              <StatCard icon="📈" title="Avg Attendance" value={`${avgAttendance}%`} sub="Average attendance" color="bg-green-500/20 text-green-300" />
              <StatCard icon="🏅" title="Certs Issued" value={certs} sub="Total certificates" color="bg-amber-500/20 text-amber-300" />
            </div>

            <div className="rounded-3xl p-6 mb-5 bg-white/[0.055] border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Recent students</h2>
                <button onClick={() => setTab('students')} className="text-violet-400 text-sm font-semibold">
                  View all
                </button>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl opacity-40 mb-3">👥</div>
                  <h3 className="font-semibold text-gray-200">No students found</h3>
                  <p className="text-sm text-gray-500 mt-1">Students will appear here once they enroll</p>
                </div>
              ) : (
                students.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                    <div className="w-11 h-11 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold">
                      {s.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </div>
                    <div className="text-sm text-green-400">{s.attendance_rate || 0}%</div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-3xl p-6 bg-white/[0.055] border border-white/10 backdrop-blur-xl shadow-2xl relative">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Your courses</h2>
                <button onClick={() => setTab('courses')} className="text-violet-400 text-sm font-semibold">
                  View all
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl opacity-40 mb-3">📖</div>
                  <h3 className="font-semibold text-gray-200">No courses found</h3>
                  <p className="text-sm text-gray-500 mt-1">Create your first course to get started</p>
                </div>
              ) : (
                courses.slice(0, 4).map(c => (
                  <div key={c.id} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 flex items-center justify-center">📘</div>
                    <div className="flex-1">
                      <div className="font-semibold">{c.title}</div>
                      <div className="text-xs text-gray-400">{c.total_modules} modules</div>
                    </div>
                    <button onClick={() => deleteCourse(c.id)} className="text-red-400 text-sm">Delete</button>
                  </div>
                ))
              )}

              <button
                onClick={() => setTab('courses')}
                className="absolute right-5 bottom-5 w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-4xl shadow-2xl"
              >
                +
              </button>
            </div>
          </>
        )}

        {tab === 'students' && (
          <div className="rounded-3xl p-5 bg-white/[0.055] border border-white/10 backdrop-blur-xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-5">Students</h2>
            {students.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No students found</div>
            ) : (
              students.map(s => (
                <div key={s.id} className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold">
                      {s.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </div>
                    <div className="text-green-400 text-sm">{s.attendance_rate || 0}%</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'courses' && (
          <div>
            <div className="rounded-3xl p-5 bg-white/[0.055] border border-white/10 backdrop-blur-xl shadow-2xl mb-5">
              <h2 className="text-2xl font-bold mb-5">Create Course</h2>

              <form onSubmit={createCourse} className="space-y-3">
                <input className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 outline-none" placeholder="Course title" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} required />
                <input className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 outline-none" placeholder="Description" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} />
                <input className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 outline-none" placeholder="Instructor name" value={newCourse.instructor} onChange={e => setNewCourse({ ...newCourse, instructor: e.target.value })} />
                <input type="number" className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 outline-none" placeholder="Total modules" value={newCourse.total_modules} onChange={e => setNewCourse({ ...newCourse, total_modules: e.target.value })} />

                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={newCourse.is_paid} onChange={e => setNewCourse({ ...newCourse, is_paid: e.target.checked })} />
                  Paid course
                </label>

                {newCourse.is_paid && (
                  <input type="number" className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 outline-none" placeholder="Price ₹" value={newCourse.price} onChange={e => setNewCourse({ ...newCourse, price: e.target.value })} />
                )}

                <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold">
                  Create Course
                </button>
              </form>
            </div>

            <div className="rounded-3xl p-5 bg-white/[0.055] border border-white/10 backdrop-blur-xl shadow-2xl">
              <h2 className="text-xl font-bold mb-4">Your Courses</h2>
              {courses.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No courses found</div>
              ) : (
                courses.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 mb-3">
                    <div className="font-bold">{c.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{c.description}</div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-cyan-400">{c.total_modules} modules</span>
                      <button onClick={() => deleteCourse(c.id)} className="text-red-400 text-sm">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'attendance' && (
          <div className="rounded-3xl p-5 bg-white/[0.055] border border-white/10 backdrop-blur-xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-5">Attendance</h2>
            {students.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No attendance data</div>
            ) : (
              students.map(s => (
                <div key={s.id} className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{s.name}</span>
                    <span className={s.attendance_rate >= 75 ? 'text-green-400' : 'text-amber-400'}>
                      {s.attendance_rate || 0}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" style={{ width: `${s.attendance_rate || 0}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'revenue' && <RevenueTab />}
        {tab === 'payout' && <PayoutTab bc="bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-2 rounded-xl" flash={flash} card="bg-white/[0.055]" txt="text-white" txt2="text-gray-400" txt3="text-gray-500" divider="border-white/10" />}
        {tab === 'profile' && <ProfileTab bc="bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-2 rounded-xl" flash={flash} card="bg-white/[0.055]" txt="text-white" txt2="text-gray-400" user={user} />}
      </div>

      {showMore && (
        <div className="fixed bottom-24 left-4 right-4 rounded-3xl bg-[#101827]/95 border border-white/10 backdrop-blur-xl p-4 z-50 shadow-2xl">
          <button onClick={() => { setTab('revenue'); setShowMore(false) }} className="w-full text-left py-3 border-b border-white/10">💰 Revenue</button>
          <button onClick={() => { setTab('payout'); setShowMore(false) }} className="w-full text-left py-3 border-b border-white/10">💳 Payout</button>
          <button onClick={() => { setTab('profile'); setShowMore(false) }} className="w-full text-left py-3 border-b border-white/10">👤 Profile</button>
          <button onClick={logout} className="w-full text-left py-3 text-red-400">⏻ Logout</button>
        </div>
      )}

      <div className="fixed bottom-3 left-3 right-3 z-40 rounded-3xl bg-[#101827]/90 border border-white/10 backdrop-blur-xl shadow-2xl p-2 flex justify-around">
        <BottomBtn id="overview" icon="⌂" label="Overview" />
        <BottomBtn id="students" icon="👥" label="Students" />
        <BottomBtn id="courses" icon="📖" label="Courses" />
        <BottomBtn id="attendance" icon="◷" label="Attendance" />
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-2xl text-xs text-gray-400"
        >
          <span className="text-2xl">•••</span>
          <span>More</span>
        </button>
      </div>
    </div>
  )
}