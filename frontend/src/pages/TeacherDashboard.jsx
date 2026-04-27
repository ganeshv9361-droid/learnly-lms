import Logo from '../components/Logo'
import MobileLayout from '../components/MobileLayout'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import AnimatedCounter from '../components/AnimatedCounter'
import RevenueTab from '../components/RevenueTab'
import PayoutTab from '../components/PayoutTab'
import ProfileTab from '../components/ProfileTab'

export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const [theme, setTheme] = useState('dark')
  const [tab, setTab] = useState('overview')
  const [courseTab, setCourseTab] = useState('videos-tab')
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [msg, setMsg] = useState({ text: '', type: 'success' })
  const [expandedStudent, setExpandedStudent] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [videos, setVideos] = useState([])
  const [assignments, setAssignments] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [quizResults, setQuizResults] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    instructor: '',
    total_modules: '',
    is_paid: false,
    price: '',
  })
  const [editCourse, setEditCourse] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [attendForm, setAttendForm] = useState({
    student_id: '',
    course_id: '',
    present: true,
  })
  const [certForm, setCertForm] = useState({ student_id: '', course_id: '' })
  const [progressForm, setProgressForm] = useState({
    enrollment_id: '',
    progress: '',
  })
  const [assignForm, setAssignForm] = useState({
    course_id: '',
    title: '',
    description: '',
    due_date: '',
    google_form_url: '',
  })
  const [gradeForm, setGradeForm] = useState({})
  const [ytForm, setYtForm] = useState({
    title: '',
    youtube_url: '',
    course_id: '',
  })
  const [uploadForm, setUploadForm] = useState({
    title: '',
    file: null,
    course_id: '',
  })
  const [announceForm, setAnnounceForm] = useState({
    course_id: '',
    title: '',
    body: '',
  })
  const [quizForm, setQuizForm] = useState({
    course_id: '',
    title: '',
    google_form_url: '',
    questions: [
      {
        question: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct: 'A',
      },
    ],
  })
  const [quizType, setQuizType] = useState('custom')

const d = true
const bg = 'learnly-page'
const sidebar = 'learnly-sidebar'
const card = 'learnly-card'
const cardHover = 'learnly-card-hover'
const txt = 'text-white'
const txt2 = 'text-gray-400'
const txt3 = 'text-gray-500'

const inp = 'w-full learnly-input'

const lbl = 'text-xs text-gray-400 mb-1.5 block'

const btn = 'learnly-btn'
const btnSm = 'learnly-btn-sm'

const divider = 'border-white/10'

const tabActive = 'learnly-nav-active'
const tabInactive = 'learnly-nav-inactive'

const subTabActive = 'learnly-subtab-active'
const subTabInactive = 'learnly-subtab-inactive'

  const flash = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  const loadAll = () => {
    api.get('/teacher/students').then((r) => setStudents(r.data)).catch(() => {})
    api.get('/courses/').then((r) => setCourses(r.data)).catch(() => {})
  }

  useEffect(() => {
    loadAll()
  }, [])

  const loadCourseContent = async (course) => {
    setSelectedCourse(course)
    setCourseTab('videos-tab')
    const [v, a, q, ann] = await Promise.all([
      api.get(`/videos/course/${course.id}`),
      api.get(`/assignments/course/${course.id}`),
      api.get(`/quizzes/course/${course.id}`),
      api.get(`/announcements/course/${course.id}`),
    ])
    setVideos(v.data)
    setAssignments(a.data)
    setQuizzes(q.data)
    setAnnouncements(ann.data)
    setYtForm((f) => ({ ...f, course_id: course.id }))
    setUploadForm((f) => ({ ...f, course_id: course.id }))
    setAssignForm((f) => ({ ...f, course_id: course.id }))
    setQuizForm((f) => ({ ...f, course_id: course.id }))
    setAnnounceForm((f) => ({ ...f, course_id: course.id }))
  }

  const createCourse = async (e) => {
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
      flash('Course created!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const saveEditCourse = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/courses/${editCourse.id}`, {
        ...editForm,
        total_modules: parseInt(editForm.total_modules) || 0,
        price: parseFloat(editForm.price) || 0,
      })
      setEditCourse(null)
      loadAll()
      flash('Course updated!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course and all its content?')) return
    try {
      await api.delete(`/courses/${id}`)
      loadAll()
      flash('Course deleted')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const markAttendance = async (e) => {
    e.preventDefault()
    try {
      await api.post('/teacher/mark-attendance', {
        student_id: parseInt(attendForm.student_id),
        course_id: parseInt(attendForm.course_id),
        present: attendForm.present,
      })
      loadAll()
      flash('Attendance marked!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const issueCertificate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/teacher/issue-certificate', {
        student_id: parseInt(certForm.student_id),
        course_id: parseInt(certForm.course_id),
      })
      flash('Certificate issued!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const updateProgress = async (e) => {
    e.preventDefault()
    try {
      await api.patch('/teacher/update-progress', {
        student_id: 0,
        enrollment_id: parseInt(progressForm.enrollment_id),
        progress: parseFloat(progressForm.progress),
      })
      loadAll()
      flash('Progress updated!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const createAssignment = async (e) => {
    e.preventDefault()
    try {
      await api.post('/assignments/', assignForm)
      setAssignForm((f) => ({
        ...f,
        title: '',
        description: '',
        due_date: '',
        google_form_url: '',
      }))
      loadCourseContent(selectedCourse)
      flash('Assignment created!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const deleteAssignment = async (id) => {
    try {
      await api.delete(`/assignments/${id}`)
      loadCourseContent(selectedCourse)
      flash('Assignment deleted')
    } catch (e) {
      flash('Error', 'error')
    }
  }

  const loadSubmissions = async (assignment_id) => {
    const r = await api.get(`/assignments/submissions/${assignment_id}`)
    setSubmissions(r.data)
    setCourseTab('submissions-tab')
  }

  const gradeSubmission = async (sub_id) => {
    const g = gradeForm[sub_id]
    if (!g?.grade) return
    try {
      await api.patch(`/assignments/grade/${sub_id}`, {
        grade: parseFloat(g.grade),
        feedback: g.feedback || '',
      })
      loadSubmissions(submissions[0]?.assignment_id || 0)
      flash('Graded!')
    } catch (e) {
      flash('Error', 'error')
    }
  }

  const addYoutube = async (e) => {
    e.preventDefault()
    try {
      await api.post('/videos/youtube', {
        course_id: parseInt(ytForm.course_id),
        title: ytForm.title,
        youtube_url: ytForm.youtube_url,
        order: videos.length,
      })
      setYtForm((f) => ({ ...f, title: '', youtube_url: '' }))
      loadCourseContent(selectedCourse)
      flash('YouTube video added!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const uploadVideo = async (e) => {
    e.preventDefault()
    if (!uploadForm.file) {
      flash('Please select a file', 'error')
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('course_id', String(uploadForm.course_id))
    fd.append('title', uploadForm.title)
    fd.append('order', String(videos.length))
    fd.append('file', uploadForm.file)
    try {
      await api.post('/videos/upload', fd)
      setUploadForm((f) => ({ ...f, title: '', file: null }))
      if (fileRef.current) fileRef.current.value = ''
      loadCourseContent(selectedCourse)
      flash('Video uploaded!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Upload failed', 'error')
    }
    setUploading(false)
  }

  const deleteVideo = async (id) => {
    await api.delete(`/videos/${id}`)
    loadCourseContent(selectedCourse)
    flash('Video deleted')
  }

  const createQuiz = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        course_id: parseInt(quizForm.course_id),
        title: quizForm.title,
        google_form_url: quizType === 'google' ? quizForm.google_form_url : null,
        questions: quizType === 'custom' ? quizForm.questions : [],
      }
      await api.post('/quizzes/', payload)
      setQuizForm((f) => ({
        ...f,
        title: '',
        google_form_url: '',
        questions: [
          {
            question: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct: 'A',
          },
        ],
      }))
      loadCourseContent(selectedCourse)
      flash('Quiz created!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const deleteQuiz = async (id) => {
    await api.delete(`/quizzes/${id}`)
    loadCourseContent(selectedCourse)
    flash('Quiz deleted')
  }

  const loadQuizResults = async (quiz_id) => {
    const r = await api.get(`/quizzes/results/${quiz_id}`)
    setQuizResults(r.data)
    setCourseTab('quiz-results-tab')
  }

  const createAnnouncement = async (e) => {
    e.preventDefault()
    try {
      await api.post('/announcements/', announceForm)
      setAnnounceForm((f) => ({ ...f, title: '', body: '' }))
      loadCourseContent(selectedCourse)
      flash('Announcement posted!')
    } catch (e) {
      flash(e.response?.data?.detail || 'Error', 'error')
    }
  }

  const deleteAnnouncement = async (id) => {
    await api.delete(`/announcements/${id}`)
    loadCourseContent(selectedCourse)
    flash('Announcement deleted')
  }

  const addQuestion = () =>
    setQuizForm((f) => ({
      ...f,
      questions: [
        ...f.questions,
        {
          question: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct: 'A',
        },
      ],
    }))

  const removeQuestion = (i) =>
    setQuizForm((f) => ({
      ...f,
      questions: f.questions.filter((_, idx) => idx !== i),
    }))

  const updateQuestion = (i, field, val) =>
    setQuizForm((f) => ({
      ...f,
      questions: f.questions.map((q, idx) => (idx === i ? { ...q, [field]: val } : q)),
    }))

  const totalStudents = students.length
  const avgAttendance = students.length
    ? Math.round(students.reduce((s, st) => s + st.attendance_rate, 0) / students.length)
    : 0

  const navItems = [
    ['overview', '📊', 'Overview'],
    ['students', '👥', 'Students'],
    ['courses', '📚', 'Courses'],
    ['attendance', '🕐', 'Attendance'],
    ['certificates', '🏅', 'Certificates'],
    ['progress', '📈', 'Progress'],
    ['revenue', '💰', 'Revenue'],
    ['payout', '💳', 'Payout'],
    ['profile', '👤', 'My Profile'],
  ]

  return (
    <div className={`min-h-screen ${bg} flex transition-colors duration-200 text-white`}>
      <div className={`w-56 ${sidebar} border-r flex flex-col p-4 gap-1 shrink-0`}>
        <div className="px-2 py-3 mb-1"><Logo size={32} textSize="text-lg"/></div>
        <div className="text-xs text-teal-400 px-3 py-1 bg-teal-400/10 rounded-lg mb-2">Teacher Panel</div>
          

        {navItems.map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key)
              setSelectedCourse(null)
              setEditCourse(null)
            }}
            className={`text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
              tab === key ? tabActive : tabInactive
            }`}
          >
            <span style={{ fontSize: 14 }}>{icon}</span>
            {label}
          </button>
        ))}

        <div className={`mt-auto border-t ${divider} pt-3`}>
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs ${txt2} transition mb-2`}
          >
            {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          <div className={`text-xs ${txt3} px-2 mb-0.5`}>{user?.name}</div>
          <div className="text-xs text-teal-400 px-2 mb-2">Teacher</div>
          <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 px-2">
            Sign out
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {msg.text && (
          <div
            className={`mb-4 text-sm px-4 py-2 rounded-lg border ${
              msg.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-teal-500/10 border-teal-500/30 text-teal-400'
            }`}
          >
            {msg.text}
          </div>
        )}

        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                ['Students', totalStudents, 'text-violet-400'],
                ['Courses', courses.length, 'text-teal-400'],
                ['Avg Attendance', avgAttendance + '%', 'text-green-400'],
                ['Certs Issued', students.reduce((s, st) => s + st.certificates, 0), 'text-amber-400'],
              ].map(([label, val, color]) => (
                <div key={label} className={`${card} border rounded-xl p-4`}>
                  <div className={`text-xs ${txt3} uppercase tracking-wider mb-2`}>{label}</div>
                  <div className={`text-2xl font-semibold ${color}`}>{val}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`${card} border rounded-xl p-5`}>
                <div className={`text-sm font-medium ${txt} mb-3`}>Recent students</div>
                {students.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 py-2 border-b ${divider} last:border-0`}
                  >
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-xs text-violet-400 font-medium">
                      {s.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm ${txt}`}>{s.name}</div>
                      <div className={`text-xs ${txt2}`}>{s.enrollments?.length} courses</div>
                    </div>
                    <div className={`text-xs ${s.attendance_rate >= 75 ? 'text-green-400' : 'text-amber-400'}`}>
                      {s.attendance_rate}%
                    </div>
                  </div>
                ))}
              </div>

              <div className={`${card} border rounded-xl p-5`}>
                <div className={`text-sm font-medium ${txt} mb-3`}>Your courses</div>
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-3 py-2 border-b ${divider} last:border-0`}
                  >
                    <div className="flex-1">
                      <div className={`text-sm ${txt}`}>{c.title}</div>
                      <div className={`text-xs ${txt2}`}>
                        {c.total_modules} modules{' '}
                        {c.is_paid && <span className="text-amber-400">· ₹{c.price}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTab('courses')
                        loadCourseContent(c)
                      }}
                      className="text-xs text-teal-400 hover:underline"
                    >
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'students' && (
          <div>
            <div className={`text-sm font-medium ${txt2} mb-3`}>{students.length} students</div>
            <div className="flex flex-col gap-3">
              {students.map((s) => (
                <div key={s.id} className={`${card} border rounded-xl overflow-hidden`}>
                  <div
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition`}
                    onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                  >
                    <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-medium text-violet-400">
                      {s.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${txt}`}>{s.name}</div>
                      <div className={`text-xs ${txt2}`}>{s.email}</div>
                    </div>
                    <div className={`flex items-center gap-4 text-xs ${txt3}`}>
                      <span>{s.enrollments?.length || 0} courses</span>
                      <span className={s.attendance_rate >= 75 ? 'text-green-400' : 'text-amber-400'}>
                        {s.attendance_rate}% att
                      </span>
                      <span className="text-amber-400">🏅 {s.certificates}</span>
                      <span>{expandedStudent === s.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {expandedStudent === s.id && (
                    <div className={`border-t ${divider} p-4 ${d ? 'bg-[#0f1117]' : 'bg-gray-50'}`}>
                      <div className={`text-xs ${txt3} mb-3`}>Enrolled courses</div>
                      {s.enrollments?.length === 0 ? (
                        <div className={`text-xs ${txt3}`}>No enrollments</div>
                      ) : (
                        s.enrollments?.map((e, i) => (
                          <div key={i} className="flex items-center gap-3 mb-2">
                            <div className={`flex-1 text-xs ${txt2} truncate`}>{e.course_title}</div>
                            <div className="w-32 h-1.5 bg-white/10 rounded-full">
                              <div className="h-1.5 bg-violet-500 rounded-full" style={{ width: e.progress + '%' }} />
                            </div>
                            <div className={`text-xs ${txt2} w-10 text-right`}>{e.progress}%</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'courses' && !selectedCourse && !editCourse && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className={`text-sm font-medium ${txt2} mb-3`}>Your courses ({courses.length})</div>
              <div className="flex flex-col gap-3">
                {courses.map((c) => (
                  <div key={c.id} className={`${card} border ${cardHover} rounded-xl p-4 transition`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className={`font-medium ${txt} mb-0.5`}>{c.title}</div>
                        <div className={`text-xs ${txt2} mb-1`}>
                          {c.instructor} · {c.total_modules} modules
                        </div>
                        <div className={`text-xs ${txt3}`}>{c.description}</div>
                        {c.is_paid && <div className="text-xs text-amber-400 mt-1">Paid · ₹{c.price}</div>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => loadCourseContent(c)} className={btnSm}>
                          Manage
                        </button>
                        <button
                          onClick={() => {
                            setEditCourse(c)
                            setEditForm({
                              title: c.title,
                              description: c.description,
                              instructor: c.instructor,
                              total_modules: c.total_modules,
                              is_paid: c.is_paid,
                              price: c.price,
                            })
                          }}
                          className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCourse(c.id)}
                          className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${card} border rounded-xl p-5`}>
              <div className={`text-sm font-medium ${txt} mb-4`}>Create new course</div>
              <form onSubmit={createCourse} className="space-y-3">
                <div>
                  <label className={lbl}>Title</label>
                  <input
                    required
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    className={inp}
                    placeholder="Course title"
                  />
                </div>

                <div>
                  <label className={lbl}>Description</label>
                  <input
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    className={inp}
                    placeholder="Short description"
                  />
                </div>

                <div>
                  <label className={lbl}>Instructor name</label>
                  <input
                    value={newCourse.instructor}
                    onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                    className={inp}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className={lbl}>Total modules</label>
                  <input
                    type="number"
                    value={newCourse.total_modules}
                    onChange={(e) => setNewCourse({ ...newCourse, total_modules: e.target.value })}
                    className={inp}
                    placeholder="10"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCourse.is_paid}
                      onChange={(e) => setNewCourse({ ...newCourse, is_paid: e.target.checked })}
                      className="accent-violet-500"
                    />
                    <span className={`text-sm ${txt2}`}>Paid course</span>
                  </label>

                  {newCourse.is_paid && (
                    <input
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                      className={inp + ' flex-1'}
                      placeholder="Price ₹"
                    />
                  )}
                </div>

                <button type="submit" className={btn + ' w-full'}>
                  Create Course
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'courses' && editCourse && (
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setEditCourse(null)} className={`${txt2} text-sm`}>
                ← Back
              </button>
              <div className={`font-medium ${txt}`}>Edit: {editCourse.title}</div>
            </div>

            <div className={`${card} border rounded-xl p-5`}>
              <form onSubmit={saveEditCourse} className="space-y-3">
                <div>
                  <label className={lbl}>Title</label>
                  <input
                    required
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className={inp + ' h-20 resize-none'}
                  />
                </div>

                <div>
                  <label className={lbl}>Instructor</label>
                  <input
                    value={editForm.instructor || ''}
                    onChange={(e) => setEditForm({ ...editForm, instructor: e.target.value })}
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Total modules</label>
                  <input
                    type="number"
                    value={editForm.total_modules || ''}
                    onChange={(e) => setEditForm({ ...editForm, total_modules: e.target.value })}
                    className={inp}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_paid || false}
                      onChange={(e) => setEditForm({ ...editForm, is_paid: e.target.checked })}
                      className="accent-violet-500"
                    />
                    <span className={`text-sm ${txt2}`}>Paid course</span>
                  </label>

                  {editForm.is_paid && (
                    <input
                      type="number"
                      value={editForm.price || ''}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className={inp + ' flex-1'}
                      placeholder="Price ₹"
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <button type="submit" className={btn}>
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCourse(null)}
                    className={`px-4 py-2 rounded-lg text-sm ${d ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'courses' && selectedCourse && !editCourse && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelectedCourse(null)} className={`${txt2} text-sm`}>
                ← Back
              </button>
              <div className={`font-medium ${txt}`}>{selectedCourse.title}</div>
            </div>

            <div className="flex gap-2 mb-5 flex-wrap">
              {[
                ['videos-tab', '🎬 Videos'],
                ['assignments-tab', '📝 Assignments'],
                ['quizzes-tab', '🧪 Quizzes'],
                ['announcements-tab', '📢 Announcements'],
                ['submissions-tab', '📬 Submissions'],
                ['quiz-results-tab', '📊 Quiz Results'],
              ].map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setCourseTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    courseTab === t ? subTabActive : subTabInactive
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {courseTab === 'videos-tab' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className={`text-sm font-medium ${txt2} mb-3`}>Videos ({videos.length})</div>
                  <div className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
                    {videos.length === 0 && <div className={`text-sm ${txt3}`}>No videos yet</div>}
                    {videos.map((v, i) => (
                      <div key={v.id} className={`${card} border rounded-lg p-3 flex items-center gap-3`}>
                        <div className={`w-6 h-6 ${d ? 'bg-white/5' : 'bg-gray-100'} rounded text-xs flex items-center justify-center ${txt2}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${txt} truncate`}>{v.title}</div>
                          <div className={`text-xs ${txt3}`}>{v.youtube_url ? 'YouTube' : 'Uploaded file'}</div>
                        </div>
                        <button onClick={() => deleteVideo(v.id)} className="text-xs text-red-400 hover:text-red-300 shrink-0">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className={`${card} border rounded-xl p-4 mb-3`}>
                    <div className={`text-xs font-medium ${txt2} mb-3`}>Add YouTube video</div>
                    <form onSubmit={addYoutube} className="space-y-2">
                      <input
                        required
                        value={ytForm.title}
                        onChange={(e) => setYtForm({ ...ytForm, title: e.target.value })}
                        className={inp}
                        placeholder="Video title"
                      />
                      <input
                        required
                        value={ytForm.youtube_url}
                        onChange={(e) => setYtForm({ ...ytForm, youtube_url: e.target.value })}
                        className={inp}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <button type="submit" className={btn + ' w-full'}>
                        Add YouTube
                      </button>
                    </form>
                  </div>

                  <div className={`${card} border rounded-xl p-4`}>
                    <div className={`text-xs font-medium ${txt2} mb-3`}>Upload video file</div>
                    <form onSubmit={uploadVideo} className="space-y-2">
                      <input
                        required
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                        className={inp}
                        placeholder="Video title"
                      />
                      <input
                        ref={fileRef}
                        required
                        type="file"
                        accept="video/*"
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                        className={inp}
                      />
                      <button type="submit" disabled={uploading} className={btn + ' w-full disabled:opacity-50'}>
                        {uploading ? 'Uploading...' : 'Upload Video'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {courseTab === 'assignments-tab' && (
              <div className="grid grid-cols-2 gap-6">
                <div className={`${card} border rounded-xl p-5`}>
                  <div className={`text-sm font-medium ${txt} mb-4`}>Create assignment</div>
                  <form onSubmit={createAssignment} className="space-y-3">
                    <div>
                      <label className={lbl}>Title</label>
                      <input
                        required
                        value={assignForm.title}
                        onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                        className={inp}
                        placeholder="Assignment title"
                      />
                    </div>

                    <div>
                      <label className={lbl}>Instructions</label>
                      <textarea
                        value={assignForm.description}
                        onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                        className={inp + ' h-20 resize-none'}
                        placeholder="What students should do..."
                      />
                    </div>

                    <div>
                      <label className={lbl}>Google Form URL (optional)</label>
                      <input
                        value={assignForm.google_form_url}
                        onChange={(e) => setAssignForm({ ...assignForm, google_form_url: e.target.value })}
                        className={inp}
                        placeholder="https://forms.google.com/..."
                      />
                    </div>

                    <div>
                      <label className={lbl}>Due date (optional)</label>
                      <input
                        type="datetime-local"
                        value={assignForm.due_date}
                        onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                        className={inp}
                      />
                    </div>

                    <button type="submit" className={btn + ' w-full'}>
                      Create Assignment
                    </button>
                  </form>
                </div>

                <div>
                  <div className={`text-sm font-medium ${txt2} mb-3`}>Assignments ({assignments.length})</div>
                  <div className="flex flex-col gap-2">
                    {assignments.length === 0 && <div className={`text-sm ${txt3}`}>No assignments yet</div>}
                    {assignments.map((a) => (
                      <div key={a.id} className={`${card} border rounded-xl p-4`}>
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1">
                            <div className={`font-medium text-sm ${txt}`}>{a.title}</div>
                            <div className={`text-xs ${txt2} mt-0.5`}>{a.description}</div>
                            {a.google_form_url && (
                              <a
                                href={a.google_form_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-400 hover:underline mt-1 block"
                              >
                                Open Google Form ↗
                              </a>
                            )}
                            {a.due_date && (
                              <div className="text-xs text-amber-400 mt-1">
                                Due: {new Date(a.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteAssignment(a.id)} className="text-xs text-red-400 hover:text-red-300 shrink-0">
                            ✕
                          </button>
                        </div>
                        <button onClick={() => loadSubmissions(a.id)} className="text-xs text-teal-400 hover:underline">
                          View submissions
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {courseTab === 'submissions-tab' && (
              <div>
                <div className={`text-sm font-medium ${txt2} mb-3`}>Submissions ({submissions.length})</div>
                {submissions.length === 0 && (
                  <div className={`text-sm ${txt3}`}>
                    No submissions yet. Click "View submissions" on an assignment.
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {submissions.map((s) => (
                    <div key={s.id} className={`${card} border rounded-xl p-4`}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-xs text-violet-400 font-medium shrink-0">
                          {s.student_name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium text-sm ${txt}`}>{s.student_name}</div>
                          <div className={`text-xs ${txt2}`}>{s.student_email}</div>
                          {s.note && <div className={`text-xs ${txt3} mt-1`}>Note: {s.note}</div>}
                          <div className={`text-xs ${txt3} mt-1`}>
                            Submitted: {new Date(s.submitted_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {s.file_path && (
                            <a
                              href={`http://localhost:8000${s.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-400 hover:underline"
                            >
                              ⬇ Download
                            </a>
                          )}
                          {s.grade !== null ? (
                            <div className="text-sm font-medium text-green-400">Graded: {s.grade}/100</div>
                          ) : (
                            <div className="text-xs text-amber-400">Not graded</div>
                          )}
                        </div>
                      </div>

                      {s.grade === null && (
                        <div className="flex gap-2 flex-wrap">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Grade /100"
                            onChange={(e) =>
                              setGradeForm((f) => ({
                                ...f,
                                [s.id]: { ...f[s.id], grade: e.target.value },
                              }))
                            }
                            className={`${d ? 'bg-[#252c42] border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg px-3 py-1.5 text-sm outline-none w-28`}
                          />
                          <input
                            placeholder="Feedback (optional)"
                            onChange={(e) =>
                              setGradeForm((f) => ({
                                ...f,
                                [s.id]: { ...f[s.id], feedback: e.target.value },
                              }))
                            }
                            className={`${d ? 'bg-[#252c42] border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg px-3 py-1.5 text-sm outline-none flex-1`}
                          />
                          <button onClick={() => gradeSubmission(s.id)} className={btnSm}>
                            Grade
                          </button>
                        </div>
                      )}

                      {s.grade !== null && s.feedback && (
                        <div className={`text-xs ${txt3} mt-1`}>Feedback: {s.feedback}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {courseTab === 'quizzes-tab' && (
              <div className="grid grid-cols-2 gap-6">
                <div className={`${card} border rounded-xl p-5`}>
                  <div className={`text-sm font-medium ${txt} mb-4`}>Create quiz</div>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setQuizType('custom')}
                      className={`flex-1 py-2 rounded-lg text-sm transition ${
                        quizType === 'custom' ? 'bg-violet-600 text-white' : subTabInactive
                      }`}
                    >
                      Custom Quiz
                    </button>
                    <button
                      onClick={() => setQuizType('google')}
                      className={`flex-1 py-2 rounded-lg text-sm transition ${
                        quizType === 'google' ? 'bg-blue-600 text-white' : subTabInactive
                      }`}
                    >
                      Google Form
                    </button>
                  </div>

                  <form onSubmit={createQuiz} className="space-y-3">
                    <div>
                      <label className={lbl}>Quiz title</label>
                      <input
                        required
                        value={quizForm.title}
                        onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                        className={inp}
                        placeholder="Quiz title"
                      />
                    </div>

                    {quizType === 'google' ? (
                      <div>
                        <label className={lbl}>Google Form URL</label>
                        <input
                          required
                          value={quizForm.google_form_url}
                          onChange={(e) => setQuizForm({ ...quizForm, google_form_url: e.target.value })}
                          className={inp}
                          placeholder="https://forms.google.com/..."
                        />
                        <div className={`text-xs ${txt3} mt-1`}>
                          Students will see this form embedded in their dashboard
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {quizForm.questions.map((q, i) => (
                          <div key={i} className={`${d ? 'bg-[#0f1117]' : 'bg-gray-50'} rounded-lg p-4 space-y-2`}>
                            <div className="flex items-center justify-between">
                              <div className={`text-xs ${txt3}`}>Question {i + 1}</div>
                              {i > 0 && (
                                <button type="button" onClick={() => removeQuestion(i)} className="text-xs text-red-400">
                                  Remove
                                </button>
                              )}
                            </div>

                            <input
                              required
                              value={q.question}
                              onChange={(e) => updateQuestion(i, 'question', e.target.value)}
                              className={inp}
                              placeholder="Question text"
                            />

                            {['a', 'b', 'c', 'd'].map((opt) => (
                              <input
                                key={opt}
                                required
                                value={q[`option_${opt}`]}
                                onChange={(e) => updateQuestion(i, `option_${opt}`, e.target.value)}
                                className={inp}
                                placeholder={`Option ${opt.toUpperCase()}`}
                              />
                            ))}

                            <div>
                              <label className={lbl}>Correct answer</label>
                              <select
                                value={q.correct}
                                onChange={(e) => updateQuestion(i, 'correct', e.target.value)}
                                className={inp}
                              >
                                {['A', 'B', 'C', 'D'].map((o) => (
                                  <option key={o}>{o}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addQuestion}
                          className={`w-full py-2 rounded-lg text-sm transition ${
                            d ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          + Add Question
                        </button>
                      </div>
                    )}

                    <button type="submit" className={btn + ' w-full'}>
                      Create Quiz
                    </button>
                  </form>
                </div>

                <div>
                  <div className={`text-sm font-medium ${txt2} mb-3`}>Quizzes ({quizzes.length})</div>
                  <div className="flex flex-col gap-2">
                    {quizzes.length === 0 && <div className={`text-sm ${txt3}`}>No quizzes yet</div>}
                    {quizzes.map((q) => (
                      <div key={q.id} className={`${card} border rounded-xl p-4`}>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className={`font-medium text-sm ${txt}`}>{q.title}</div>
                            <div className={`text-xs ${txt2}`}>
                              {q.google_form_url ? 'Google Form' : `${q.question_count} questions`}
                            </div>
                          </div>
                          <button onClick={() => loadQuizResults(q.id)} className="text-xs text-teal-400 hover:underline mr-2">
                            Results
                          </button>
                          <button onClick={() => deleteQuiz(q.id)} className="text-xs text-red-400 hover:text-red-300">
                            ✕
                          </button>
                        </div>

                        {q.google_form_url && (
                          <a
                            href={q.google_form_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-400 hover:underline mt-2 block"
                          >
                            Open Google Form ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {courseTab === 'quiz-results-tab' && (
              <div>
                <div className={`text-sm font-medium ${txt2} mb-3`}>
                  Quiz results ({quizResults.length} attempts)
                </div>
                {quizResults.length === 0 && (
                  <div className={`text-sm ${txt3}`}>No attempts yet. Select a quiz and click Results.</div>
                )}
                <div className="flex flex-col gap-2">
                  {quizResults.map((r, i) => (
                    <div key={i} className={`${card} border rounded-xl p-4 flex items-center gap-4`}>
                      <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-xs text-violet-400 font-medium">
                        {r.student_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${txt}`}>{r.student_name}</div>
                        <div className={`text-xs ${txt2}`}>{r.student_email}</div>
                      </div>
                      <div className={`text-xl font-semibold ${r.percentage >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {r.percentage}%
                      </div>
                      <div className={`text-xs ${txt3}`}>{r.score}/{r.total}</div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          r.percentage >= 50
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {r.percentage >= 50 ? 'Passed' : 'Failed'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {courseTab === 'announcements-tab' && (
              <div className="grid grid-cols-2 gap-6">
                <div className={`${card} border rounded-xl p-5`}>
                  <div className={`text-sm font-medium ${txt} mb-4`}>Post announcement</div>
                  <form onSubmit={createAnnouncement} className="space-y-3">
                    <div>
                      <label className={lbl}>Title</label>
                      <input
                        required
                        value={announceForm.title}
                        onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                        className={inp}
                        placeholder="Announcement title"
                      />
                    </div>

                    <div>
                      <label className={lbl}>Message</label>
                      <textarea
                        required
                        value={announceForm.body}
                        onChange={(e) => setAnnounceForm({ ...announceForm, body: e.target.value })}
                        className={inp + ' h-28 resize-none'}
                        placeholder="Write your message..."
                      />
                    </div>

                    <button type="submit" className={btn + ' w-full'}>
                      Post Announcement
                    </button>
                  </form>
                </div>

                <div>
                  <div className={`text-sm font-medium ${txt2} mb-3`}>Posted ({announcements.length})</div>
                  {announcements.length === 0 && <div className={`text-sm ${txt3}`}>No announcements yet</div>}
                  <div className="flex flex-col gap-3">
                    {announcements.map((a) => (
                      <div key={a.id} className={`${card} border rounded-xl p-4`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className={`font-medium text-sm ${txt}`}>{a.title}</div>
                            <div className={`text-xs ${txt2} mt-1`}>{a.body}</div>
                            <div className={`text-xs ${txt3} mt-2`}>
                              {new Date(a.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <button onClick={() => deleteAnnouncement(a.id)} className="text-xs text-red-400 hover:text-red-300 shrink-0">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'attendance' && (
          <div className="grid grid-cols-2 gap-6">
            <div className={`${card} border rounded-xl p-5`}>
              <div className={`text-sm font-medium ${txt} mb-4`}>Mark attendance</div>
              <form onSubmit={markAttendance} className="space-y-3">
                <div>
                  <label className={lbl}>Student</label>
                  <select
                    required
                    value={attendForm.student_id}
                    onChange={(e) => setAttendForm({ ...attendForm, student_id: e.target.value })}
                    className={inp}
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={lbl}>Course</label>
                  <select
                    required
                    value={attendForm.course_id}
                    onChange={(e) => setAttendForm({ ...attendForm, course_id: e.target.value })}
                    className={inp}
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={lbl}>Status</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setAttendForm({ ...attendForm, present: true })}
                      className={`flex-1 py-2 rounded-lg text-sm transition ${
                        attendForm.present ? 'bg-green-600 text-white' : subTabInactive
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendForm({ ...attendForm, present: false })}
                      className={`flex-1 py-2 rounded-lg text-sm transition ${
                        !attendForm.present ? 'bg-red-600 text-white' : subTabInactive
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>

                <button type="submit" className={btn + ' w-full'}>
                  Mark Attendance
                </button>
              </form>
            </div>

            <div>
              <div className={`text-sm font-medium ${txt2} mb-3`}>Attendance overview</div>
              <div className="flex flex-col gap-2">
                {students.map((s) => (
                  <div key={s.id} className={`${card} border rounded-lg p-3 flex items-center gap-3`}>
                    <div className={`text-sm ${txt} flex-1`}>{s.name}</div>
                    <div className="w-28 h-1.5 bg-white/10 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${s.attendance_rate >= 75 ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: s.attendance_rate + '%' }}
                      />
                    </div>
                    <div className={`text-xs w-10 text-right ${s.attendance_rate >= 75 ? 'text-green-400' : 'text-amber-400'}`}>
                      {s.attendance_rate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'certificates' && (
          <div className="grid grid-cols-2 gap-6">
            <div className={`${card} border rounded-xl p-5`}>
              <div className={`text-sm font-medium ${txt} mb-4`}>Issue certificate</div>
              <form onSubmit={issueCertificate} className="space-y-3">
                <div>
                  <label className={lbl}>Student</label>
                  <select
                    required
                    value={certForm.student_id}
                    onChange={(e) => setCertForm({ ...certForm, student_id: e.target.value })}
                    className={inp}
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={lbl}>Course</label>
                  <select
                    required
                    value={certForm.course_id}
                    onChange={(e) => setCertForm({ ...certForm, course_id: e.target.value })}
                    className={inp}
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className={btn + ' w-full'}>
                  Issue Certificate
                </button>
              </form>
            </div>

            <div>
              <div className={`text-sm font-medium ${txt2} mb-3`}>Issued certificates</div>
              {students.filter((s) => s.certificates > 0).length === 0 ? (
                <div className={`text-sm ${txt3}`}>No certificates issued yet.</div>
              ) : (
                students
                  .filter((s) => s.certificates > 0)
                  .map((s) => (
                    <div
                      key={s.id}
                      className={`${card} border border-amber-500/20 rounded-lg p-3 flex items-center gap-3 mb-2`}
                    >
                      <div className="flex-1">
                        <div className={`text-sm ${txt}`}>{s.name}</div>
                        <div className={`text-xs ${txt2}`}>{s.email}</div>
                      </div>
                      <div className="text-xs text-amber-400">🏅 {s.certificates}</div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {tab === 'progress' && (
          <div className="grid grid-cols-2 gap-6">
            <div className={`${card} border rounded-xl p-5`}>
              <div className={`text-sm font-medium ${txt} mb-4`}>Update student progress</div>
              <form onSubmit={updateProgress} className="space-y-3">
                <div>
                  <label className={lbl}>Student & course</label>
                  <select
                    required
                    onChange={(e) => setProgressForm({ ...progressForm, enrollment_id: e.target.value })}
                    className={inp}
                  >
                    <option value="">Select enrollment</option>
                    {students.flatMap((s) =>
                      s.enrollments?.map((e) => (
                        <option key={e.enrollment_id} value={e.enrollment_id}>
                          {s.name} — {e.course_title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className={lbl}>Progress %</label>
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    value={progressForm.progress}
                    onChange={(e) => setProgressForm({ ...progressForm, progress: e.target.value })}
                    className={inp}
                    placeholder="0 to 100"
                  />
                </div>

                <button type="submit" className={btn + ' w-full'}>
                  Update
                </button>
              </form>
            </div>

            <div>
              <div className={`text-sm font-medium ${txt2} mb-3`}>All progress</div>
              <div className="flex flex-col gap-3">
                {students.map((s) => (
                  <div key={s.id} className={`${card} border rounded-xl p-4`}>
                    <div className={`font-medium text-sm ${txt} mb-2`}>{s.name}</div>
                    {s.enrollments?.length === 0 ? (
                      <div className={`text-xs ${txt3}`}>No enrollments</div>
                    ) : (
                      s.enrollments?.map((e, i) => (
                        <div key={i} className="flex items-center gap-3 mb-1.5">
                          <div className={`flex-1 text-xs ${txt2} truncate`}>{e.course_title}</div>
                          <div className="w-28 h-1.5 bg-white/10 rounded-full">
                            <div className="h-1.5 bg-violet-500 rounded-full" style={{ width: e.progress + '%' }} />
                          </div>
                          <div className={`text-xs ${txt2} w-8 text-right`}>{e.progress}%</div>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'revenue' && <RevenueTab />}

        {tab === 'payout' && (
          <PayoutTab
            bc={btn}
            flash={flash}
            card={card}
            txt={txt}
            txt2={txt2}
            txt3={txt3}
            divider={divider}
          />
        )}

        {tab === 'profile' && (
          <ProfileTab
            bc={btn}
            flash={flash}
            card={card}
            txt={txt}
            txt2={txt2}
            user={user}
          />
        )}
      </div>
    </div>
  )
}