import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import AnimatedCounter from '../components/AnimatedCounter'
import PaymentModal from '../components/PaymentModal'
import MobileLayout from '../components/MobileLayout'
import AITutorChat from '../components/AITutorChat'
import Logo from '../components/Logo'
import LeaderboardTab from '../components/LeaderboardTab'
import NotesPanel from '../components/NotesPanel'

function getYoutubeId(url) {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

function getVideoSrc(filePath) {
  if (!filePath) return ''

  if (filePath.startsWith('https://') || filePath.startsWith('http://')) {
    return filePath
  }

  return `https://learnly-lms-hqch.onrender.com${filePath}`
}

const navItems = [
  ['ai-tutor','🤖','AI Tutor'],
  ['courses','📚','Courses'],
  ['my-courses','📖','My Courses'],
  ['leaderboard','🏆','Leaderboard'],
  ['announcements','📢','Announcements'],
  ['assignments','📝','Assignments'],
  ['quizzes','🧪','Quizzes'],
  ['attendance','🕐','Attendance'],
  ['certificates','🏅','Certificates'],
  ['orders','💳','Orders'],
  ['referral','🔗','Refer Friends'],
]

function UpcomingClasses() {
  const [classes, setClasses] = useState([])
  useEffect(() => {
    api.get('/live-classes/upcoming').then(r => setClasses(r.data)).catch(()=>{})
  }, [])
  if (classes.length === 0) return null
  return (
    <div className="mb-4">
      <div className="text-sm font-semibold text-white mb-2">📹 Upcoming Live Classes</div>
      <div className="space-y-2">
        {classes.map(c => (
          <div key={c.id} className="glass rounded-xl p-3 border border-violet-500/20 flex items-center gap-3">
            <div className="text-2xl">📹</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{c.title}</div>
              <div className="text-xs text-gray-400 truncate">{c.course}</div>
              <div className="text-xs text-violet-400">
                {new Date(c.scheduled_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · {c.duration_mins} mins
              </div>
            </div>
            <a href={c.meet_link} target="_blank" rel="noreferrer"
              className="btn-primary text-white text-xs px-3 py-2 rounded-xl shrink-0">
              Join
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('courses')
  const [courseTab, setCourseTab] = useState('videos')
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [attempts, setAttempts] = useState([])
  const [certificates, setCertificates] = useState([])
  const [referral, setReferral] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [orders, setOrders] = useState([])
  const [msg, setMsg] = useState({ text:'', type:'success' })
  const [playingCourse, setPlayingCourse] = useState(null)
  const [videos, setVideos] = useState([])
  const [activeVideo, setActiveVideo] = useState(null)
  const videoRef = useRef(null)
  const [videoSpeed, setVideoSpeed] = useState(1)
  const [assignments, setAssignments] = useState([])
  const [submitForm, setSubmitForm] = useState({ assignment_id:'', note:'', file:null })
  const fileRef = useRef()
  const [quizzes, setQuizzes] = useState([])
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)
  const [payingCourse, setPayingCourse] = useState(null)
  const [teacherContact, setTeacherContact] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const categories = ['All','Technology','Programming','Business','Design','Science','Language','Music','Health','General','Other']
  const [streak, setStreak] = useState({current_streak:0, longest_streak:0, total_days:0})
  const [discussions, setDiscussions] = useState([])
  const [discussionMsg, setDiscussionMsg] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [ratings, setRatings] = useState({average:0, total:0, ratings:[]})
  const [myRating, setMyRating] = useState({rating:0, review:''})
  const [showRatingForm, setShowRatingForm] = useState(false)

  const flash = (text, type='success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text:'', type:'success' }), 3500)
  }

  const loadAll = () => {
    api.get('/courses/all').then(r => setCourses(r.data)).catch(() => api.get('/courses/').then(r => setCourses(r.data)))
    api.get('/enrollments/my').then(r => setEnrollments(r.data))
    api.get('/attendance/my').then(r => setAttendance(r.data))
    api.get('/assignments/my-submissions').then(r => setSubmissions(r.data))
    api.get('/quizzes/my-attempts').then(r => setAttempts(r.data))
    api.get('/certificates/my').then(r => setCertificates(r.data))
    api.get('/referrals/my-code').then(r => setReferral(r.data))
    api.get('/announcements/my').then(r => setAnnouncements(r.data))
    api.get('/payments/my-orders').then(r => setOrders(r.data))
    api.get('/streaks/my').then(r => setStreak(r.data)).catch(()=>{})
    api.get('/courses/all').then(async r => {
      const coursesData = r.data
      const withRatings = await Promise.all(
        coursesData.map(async c => {
          try {
            const rat = await api.get(`/ratings/course/${c.id}`)
            return {...c, avg_rating: rat.data.average, total_ratings: rat.data.total}
          } catch { return {...c, avg_rating: 0, total_ratings: 0} }
        })
      )
      setCourses(withRatings)
    }).catch(() => api.get('/courses/').then(r => setCourses(r.data)))
  }

  useEffect(() => { loadAll() }, [])

  const [courseThumbnails, setCourseThumbnails] = useState({})

  useEffect(() => {
    const handleBack = () => {
      if (playingCourse) {
        setPlayingCourse(null)
        loadAll()
      } else if (tab !== 'courses') {
        setTab('courses')
      }
      window.history.pushState(null, '', window.location.href)
    }
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handleBack)
    return () => window.removeEventListener('popstate', handleBack)
  }, [playingCourse, tab])

  useEffect(() => {
    if (courses.length === 0) return
    courses.forEach(async (c) => {
      try {
        const r = await api.get(`/videos/course/${c.id}`)
        const firstYT = r.data.find(v => v.youtube_url)
        if (firstYT) {
          const match = firstYT.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
          if (match) {
            setCourseThumbnails(prev => ({
              ...prev,
              [c.id]: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
            }))
          }
        }
      } catch(e) {}
    })
  }, [courses])

  

  const enroll = async (course_id) => {
    try {
      await api.post('/enrollments/', { course_id })
      loadAll()
      flash('Enrolled successfully! 🎉')
    } catch(e) { flash(e.response?.data?.detail||'Error','error') }
  }

  const openCourse = async (enrollment) => {
  try {
    setPlayingCourse(enrollment)
    setActiveVideo(null)
    setQuizResult(null)
    setActiveQuiz(null)
    setCourseTab('videos')
    setTeacherContact(null)

    // Record today's study activity
    api.post('/streaks/study').catch(() => {})


    const [
      vids,
      asgn,
      qzs,
      contact,
      disc,
      rat,
      myRat
    ] = await Promise.all([
      api.get(`/videos/course/${enrollment.course_id}`),

      api.get(`/assignments/course/${enrollment.course_id}`),

      api.get(`/quizzes/course/${enrollment.course_id}`),

      api
        .get(
          `/teacher-profile/course/${enrollment.course_id}/teacher-contact`
        )
        .catch(() => ({ data: null })),

      api
        .get(`/discussions/course/${enrollment.course_id}`)
        .catch(() => ({ data: [] })),

      api
        .get(`/ratings/course/${enrollment.course_id}`)
        .catch(() => ({ data: [] })),

      api
        .get(`/ratings/my/${enrollment.course_id}`)
        .catch(() => ({ data: null }))
        
    ])

    setVideos(vids.data)
    setAssignments(asgn.data)
    setQuizzes(qzs.data)
    setTeacherContact(contact.data)

    setDiscussions(disc.data)
    setRatings(rat.data)
    setMyRating(myRat.data)

    if (vids.data && vids.data.length > 0) {
      setActiveVideo(vids.data[0])
    }

  } catch (e) {
    console.error('Error opening course:', e)
    flash(
      e.response?.data?.detail || 'Failed to load course',
      'error'
    )
  }
}

  const markVideoWatched = async (video) => {
    try {
      await api.post('/watch/mark-watched', {
        video_id: video.id,
        course_id: playingCourse.course_id
      })
      loadAll()
    } catch(e) { console.log(e) }
  }

  const submitAssignment = async (e) => {
    e.preventDefault()
    if (!submitForm.file) return

    const fd = new FormData()
    fd.append('assignment_id', submitForm.assignment_id)
    fd.append('note', submitForm.note)
    fd.append('file', submitForm.file)

    try {
      await api.post('/assignments/submit', fd, { headers:{'Content-Type':'multipart/form-data'} })
      setSubmitForm({ assignment_id:'', note:'', file:null })
      if (fileRef.current) fileRef.current.value = ''
      loadAll()
      flash('Assignment submitted! 📝')
    } catch(e) { flash(e.response?.data?.detail||'Error','error') }
  }

  const startQuiz = async (quiz) => {
    try {
      const r = await api.get(`/quizzes/${quiz.id}/questions`)
      setActiveQuiz(quiz)
      setQuestions(r.data)
      setAnswers({})
      setQuizResult(null)
    } catch(e) { flash(e.response?.data?.detail||'Already attempted','error') }
  }

  const submitQuiz = async () => {
    const ans = Object.entries(answers).map(([question_id, answer]) => ({
      question_id: parseInt(question_id), answer
    }))

    try {
      const r = await api.post('/quizzes/attempt', { quiz_id: activeQuiz.id, answers: ans })
      setQuizResult(r.data)
      setActiveQuiz(null)
      loadAll()
    } catch(e) { flash(e.response?.data?.detail||'Error','error') }
  }

    const downloadCert = (cert) => {
    const verifyUrl = `https://learnly-lms-hqch.onrender.com/api/verify-cert/${cert.id}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#0a0a0f,#0f0a1f);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px;}
  .cert{background:linear-gradient(135deg,#13131f,#1a1030);border:1px solid rgba(124,58,237,0.3);border-radius:24px;padding:60px 80px;text-align:center;max-width:780px;width:100%;position:relative;}
  .cert::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#7c3aed,#06b6d4,#7c3aed);}
  .logo{font-family:'Playfair Display',serif;font-size:28px;color:#a78bfa;margin-bottom:8px;letter-spacing:2px;}
  .name{font-family:'Playfair Display',serif;font-size:48px;color:#fff;margin-bottom:20px;border-bottom:1px solid rgba(124,58,237,0.3);padding-bottom:20px;}
  .course{font-size:26px;color:#a78bfa;font-weight:600;margin-bottom:40px;}
  .qr-section{margin-top:30px;display:flex;align-items:center;justify-content:center;gap:16px;}
  .qr-text{font-size:11px;color:#6b7280;text-align:left;}
  .verified{display:inline-flex;align-items:center;gap:8px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#34d399;padding:8px 20px;border-radius:50px;font-size:12px;margin-top:20px;}
</style>
</head>
<body>
<div class="cert">
  <div class="logo">✦ Learnly</div>
  <div style="font-size:11px;color:#6b7280;letter-spacing:4px;text-transform:uppercase;margin-bottom:50px;">Certificate of Completion</div>
  <div style="font-size:48px;margin:20px 0">🏅</div>
  <div style="font-size:12px;color:#9ca3af;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">This certifies that</div>
  <div class="name">${user.name}</div>
  <div style="font-size:12px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">has successfully completed</div>
  <div class="course">${cert.course}</div>
  <div style="font-size:13px;color:#6b7280;">Issued on ${new Date(cert.issued_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
  <div class="verified">✓ Verified by Learnly</div>
  <div class="qr-section">
    <img src="${qrUrl}" width="80" height="80" alt="QR Code"/>
    <div class="qr-text">
      <div style="font-weight:600;color:#a78bfa;margin-bottom:4px;">Verify Certificate</div>
      <div>Scan QR code or visit:</div>
      <div style="color:#7c3aed;font-size:10px;">${verifyUrl}</div>
      <div style="margin-top:4px;">Certificate ID: #${cert.id}</div>
    </div>
  </div>
</div>
</body></html>`
    const blob = new Blob([html], {type:'text/html'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cert.course.replace(/\s+/g,'-')}-certificate.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyReferral = () => {
    navigator.clipboard.writeText(referral?.referral_link||'')
    flash('Referral link copied! 🔗')
  }

  const sidebarContent = ({ closeSidebar, collapsed, toggleCollapse }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b shrink-0" style={{borderColor:'rgba(255,255,255,0.06)'}}>
        {collapsed ? (
          <div className="flex justify-center">
            <Logo size={32} showText={false}/>
          </div>
        ) : (
          <Logo size={32} textSize="text-lg"/>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(([key,icon,label]) => (
          <button key={key}
            onClick={() => { setTab(key); closeSidebar() }}
            className={`nav-item w-full flex items-center px-3 py-2.5 text-sm transition-all ${tab===key?'active':''} ${collapsed?'justify-center':''}`}
            style={tab!==key?{color:'var(--text3)'}:{}}
            title={collapsed?label:''}>
            <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left ml-3 truncate">{label}</span>
                {key==='announcements' && announcements.length>0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold ml-1"
                    style={{background:'rgba(124,58,237,0.3)',color:'#a78bfa'}}>
                    {announcements.length}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t shrink-0" style={{borderColor:'rgba(255,255,255,0.06)'}}>
        {!collapsed && (
          <div className="glass rounded-xl p-2.5 mb-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-xs" style={{color:'#8b5cf6'}}>Student</div>
            </div>
          </div>
        )}
        <button onClick={logout}
          className={`w-full flex items-center px-2 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition ${collapsed?'justify-center':'gap-2'}`}>
          <span>⏻</span>
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </div>
  )

  if (playingCourse) return (
    <div className="min-h-screen flex flex-col" style={{background:'#0a0a0f'}}>
      <div className="glass border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => { setPlayingCourse(null); loadAll() }}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition text-sm shrink-0"
        >
          ← Back
        </button>

        <div className="font-semibold text-white text-sm flex-1 min-w-0 truncate">
          {playingCourse.course_title}
        </div>

        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          {[['videos','🎬'],['assignments','📝'],['quizzes','🧪'],['contact','📞'],['discuss','💬 Forum'],
            ['review','⭐ Rate']].map(([t,icon]) => (
            <button
              key={t}
              onClick={() => { setCourseTab(t); setActiveQuiz(null); setQuizResult(null) }}
              className={`text-xs px-3 py-2 rounded-xl transition flex-1 sm:flex-none ${courseTab===t?'btn-primary text-white':'text-gray-400 glass'}`}
            >
              {icon} {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {msg.text && (
        <div className={`mx-4 mt-3 text-sm px-4 py-2 rounded-xl border ${msg.type==='error'?'bg-red-500/10 border-red-500/20 text-red-400':'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex-1 flex flex-col sm:flex-row p-4 gap-4 overflow-hidden">
        {courseTab === 'videos' && (
          <>
            <div className="flex-1 min-w-0">
              {!activeVideo ? (
                <div className="glass rounded-2xl h-48 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-3xl mb-2">🎬</div>
                    <div className="text-sm">No videos yet</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className="rounded-2xl overflow-hidden mb-3 shadow-2xl bg-black"
                    style={{ aspectRatio: '16/9' }}
                  >
                    {activeVideo.youtube_url ? (
  <iframe
    key={activeVideo.id}
    width="100%"
    height="100%"
    src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo.youtube_url)}?autoplay=1`}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    className="w-full h-full"
    onLoad={() =>
      setTimeout(() => markVideoWatched(activeVideo), 30000)
    }
  />
) : (
  <div className="relative w-full h-full">
    <video
      key={activeVideo.id}
      ref={videoRef}
      controls
      autoPlay
      playsInline
      preload="auto"
      className="w-full h-full bg-black"
      src={
        activeVideo.file_path?.startsWith('http')
          ? activeVideo.file_path
          : `https://learnly-lms-hqch.onrender.com${activeVideo.file_path}`
      }
      onEnded={() => markVideoWatched(activeVideo)}
      onError={(e) => {
        console.log('Video play error:', e.currentTarget.error)
        console.log(
          'Video URL:',
          activeVideo.file_path?.startsWith('http')
            ? activeVideo.file_path
            : `https://learnly-lms-hqch.onrender.com${activeVideo.file_path}`
        )
      }}
    >
      Your browser does not support the video tag.
    </video>

    {/* Speed control */}
    <div className="absolute bottom-14 right-3 flex gap-1">
      {[0.75, 1, 1.25, 1.5, 2].map(speed => (
        <button
          key={speed}
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.playbackRate = speed
              setVideoSpeed(speed)
            }
          }}
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background:
              videoSpeed === speed
                ? '#7c3aed'
                : 'rgba(0,0,0,0.7)',
            color: 'white'
          }}
        >
          {speed}x
        </button>
      ))}
    </div>
  </div>
)}
                  </div>

                  <div className="glass rounded-xl p-3 border border-white/5">
                    <div className="font-semibold text-white text-sm">
                      {activeVideo.title}
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${
                        activeVideo.youtube_url
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {activeVideo.youtube_url ? '▶ YouTube' : '▶ Cloudinary Video'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full sm:w-64 shrink-0">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 px-1">
                Playlist · {videos.length} videos
              </div>

              <div className="flex flex-col gap-2 max-h-64 sm:max-h-full overflow-y-auto">
                {videos.length === 0 && (
                  <div className="text-sm text-gray-600 text-center py-4">
                    No videos yet
                  </div>
                )}

                {videos.map((v, i) => (
                  <div
                    key={v.id}
                    onClick={() => setActiveVideo(v)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                      activeVideo?.id === v.id
                        ? 'border-violet-500/40'
                        : 'border-white/5 glass hover:border-white/15'
                    }`}
                    style={
                      activeVideo?.id === v.id
                        ? { background: 'rgba(124,58,237,0.15)' }
                        : {}
                    }
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        activeVideo?.id === v.id ? 'btn-primary text-white' : ''
                      }`}
                      style={
                        activeVideo?.id !== v.id
                          ? { background: 'rgba(255,255,255,0.06)' }
                          : {}
                      }
                    >
                      {activeVideo?.id === v.id ? '▶' : i + 1}
                    </div>

                    <div className="glass rounded-2xl p-3 border border-white/5 flex-1 min-h-0" style={{maxHeight:'300px'}}>
                      <NotesPanel
                        courseId={playingCourse?.course_id}
                        videoId={activeVideo?.id}
                        currentTime={videoRef.current?.currentTime}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{v.title}</div>
                      <div className="text-xs text-gray-500">
                        {v.youtube_url ? 'YouTube' : 'Cloudinary Video'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {courseTab==='assignments' && (
          <div className="flex-1 space-y-3">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Assignments</div>
            {assignments.length===0 && (
              <div className="glass rounded-xl p-8 text-center text-gray-600">
                <div className="text-3xl mb-2">📝</div>No assignments yet
              </div>
            )}
            {assignments.map(a => {
              const submitted = submissions.find(s => s.assignment_id===a.id)
              return (
                <div key={a.id} className="glass rounded-xl p-4 border border-white/5">
                  <div className="font-medium text-white text-sm mb-1">{a.title}</div>
                  <div className="text-xs text-gray-400 mb-2">{a.description}</div>
                  {a.google_form_url && (
                    <a href={a.google_form_url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 block mb-2">📋 Open Google Form ↗</a>
                  )}
                  {a.due_date && <div className="text-xs text-amber-400 mb-2">⏰ Due: {new Date(a.due_date).toLocaleDateString()}</div>}
                  {submitted ? (
                    <div>
                      <div className="text-xs text-green-400">✓ Submitted</div>
                      {submitted.grade!==null && (
                        <div className="text-xs text-violet-400 mt-1">Grade: {submitted.grade}/100{submitted.feedback?` — ${submitted.feedback}`:''}</div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {submitForm.assignment_id===a.id ? (
                        <form onSubmit={submitAssignment} className="space-y-2 mt-2">
                          <textarea value={submitForm.note}
                            onChange={e=>setSubmitForm({...submitForm,note:e.target.value})}
                            className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none h-20 resize-none"
                            style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}
                            placeholder="Note to teacher..."/>
                          <input ref={fileRef} required type="file"
                            onChange={e=>setSubmitForm({...submitForm,file:e.target.files[0]})}
                            className="w-full rounded-xl px-3 py-2 text-sm text-gray-300"
                            style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}/>
                          <div className="flex gap-2">
                            <button type="submit" className="flex-1 btn-primary text-white py-2 rounded-xl text-sm">Submit</button>
                            <button type="button" onClick={()=>setSubmitForm({assignment_id:'',note:'',file:null})}
                              className="px-4 py-2 rounded-xl text-sm text-gray-400 glass">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={()=>setSubmitForm({...submitForm,assignment_id:a.id})}
                          className="text-xs px-4 py-2 rounded-lg mt-2 transition"
                          style={{background:'rgba(124,58,237,0.2)',color:'#a78bfa',border:'1px solid rgba(124,58,237,0.3)'}}>
                          Upload Submission
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {courseTab==='quizzes' && (
          <div className="flex-1">
            {quizResult && (
              <div className="max-w-sm mx-auto text-center animate-fade-up py-8">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4 ${quizResult.passed?'bg-green-500/20 border-2 border-green-500':'bg-red-500/20 border-2 border-red-500'}`}>
                  {quizResult.percentage}%
                </div>
                <div className="text-xl font-bold text-white mb-1">{quizResult.score}/{quizResult.total} correct</div>
                <div className={`text-sm mb-4 ${quizResult.passed?'text-green-400':'text-red-400'}`}>
                  {quizResult.passed?'🎉 Passed!':'Keep practicing!'}
                </div>
                <button onClick={()=>setQuizResult(null)} className="btn-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm">Back</button>
              </div>
            )}
            {activeQuiz && !quizResult && (
              <div className="max-w-2xl animate-fade-in">
                <div className="text-base font-semibold text-white mb-1">{activeQuiz.title}</div>
                <div className="text-xs text-gray-500 mb-4">{questions.length} questions</div>
                <div className="space-y-4">
                  {questions.map((q,i) => (
                    <div key={q.id} className="glass rounded-xl p-4 border border-white/5">
                      <div className="text-sm text-white font-medium mb-3">{i+1}. {q.question}</div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {['A','B','C','D'].map(opt => (
                          <button key={opt} type="button"
                            onClick={()=>setAnswers({...answers,[q.id]:opt})}
                            className={`text-left px-4 py-3 rounded-xl text-sm transition border ${answers[q.id]===opt?'border-violet-500 text-white':'border-white/10 text-gray-300 glass'}`}
                            style={answers[q.id]===opt?{background:'rgba(124,58,237,0.3)'}:{}}>
                            <span className="font-bold mr-2 text-violet-400">{opt}.</span>
                            {q[`option_${opt.toLowerCase()}`]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={submitQuiz}
                    disabled={Object.keys(answers).length<questions.length}
                    className="btn-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40">
                    Submit ({Object.keys(answers).length}/{questions.length})
                  </button>
                  <button onClick={()=>setActiveQuiz(null)} className="glass text-gray-400 px-4 py-2.5 rounded-xl text-sm hover:text-white transition">Cancel</button>
                </div>
              </div>
            )}
            {!activeQuiz && !quizResult && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Quizzes</div>
                {quizzes.length===0 && (
                  <div className="glass rounded-xl p-8 text-center text-gray-600">
                    <div className="text-3xl mb-2">🧪</div>No quizzes yet
                  </div>
                )}
                <div className="space-y-3">
                  {quizzes.map(q => {
                    const attempted = attempts.find(a=>a.quiz_title===q.title)
                    return (
                      <div key={q.id} className="glass rounded-xl p-4 border border-white/5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate">{q.title}</div>
                          <div className="text-xs text-gray-400">{q.google_form_url?'Google Form':`${q.question_count} questions`}</div>
                        </div>
                        {q.google_form_url ? (
                          <a href={q.google_form_url} target="_blank" rel="noreferrer"
                            className="text-xs px-3 py-2 rounded-xl shrink-0"
                            style={{background:'rgba(59,130,246,0.2)',color:'#60a5fa'}}>
                            Open ↗
                          </a>
                        ) : attempted ? (
                          <div className="text-right shrink-0">
                            <div className={`text-lg font-bold ${attempted.percentage>=50?'text-green-400':'text-red-400'}`}>{attempted.percentage}%</div>
                            <div className="text-xs text-gray-500">Done</div>
                          </div>
                        ) : (
                          <button onClick={()=>startQuiz(q)} className="btn-primary text-white px-4 py-2 rounded-xl text-xs font-medium shrink-0">Start</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

                {courseTab==='discuss' && (
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-1">
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!discussionMsg.trim()) return
              try {
                await api.post('/discussions/', {
                  course_id: playingCourse.course_id,
                  message: discussionMsg,
                  parent_id: replyTo
                })
                setDiscussionMsg('')
                setReplyTo(null)
                const r = await api.get(`/discussions/course/${playingCourse.course_id}`)
                setDiscussions(r.data)
              } catch(e) { flash('Failed to post', 'error') }
            }} className="flex gap-2">
              <input value={discussionMsg} onChange={e => setDiscussionMsg(e.target.value)}
                className="input-base flex-1"
                placeholder={replyTo ? 'Write a reply...' : 'Ask a question or share thoughts...'}/>
              {replyTo && (
                <button type="button" onClick={() => setReplyTo(null)}
                  className="text-xs text-gray-400 px-2">✕</button>
              )}
              <button type="submit" className="btn-primary text-white px-4 rounded-xl text-sm">Post</button>
            </form>
            {discussions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2">💬</div>
                <div className="text-sm">No discussions yet. Start the conversation!</div>
              </div>
            )}
            {discussions.map(d => (
              <div key={d.id} className="glass rounded-xl p-4 border border-white/5">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {d.user_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{d.user_name}</span>
                      {d.user_role === 'teacher' && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(13,148,136,0.2)',color:'#2dd4bf'}}>Teacher</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">{d.message}</div>
                    <div className="flex gap-3">
  <button
    onClick={() => setReplyTo(d.id)}
    className="text-xs text-violet-400 mt-1 hover:underline"
  >
    Reply
  </button>

  <button
  onClick={async () => {
    console.log("Deleting discussion:", d.id);

    try {
      const response = await api.delete(`/discussions/${d.id}`);

      console.log("DELETE RESPONSE:", response);

      // Remove it immediately from the screen
      setDiscussions((prev) =>
        prev.filter((item) => item.id !== d.id)
      );

      flash("Discussion deleted successfully", "success");

    } catch (error) {
      console.error("DELETE ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      flash(
        error.response?.data?.detail || "Delete failed",
        "error"
      );
    }
  }}
  className="text-xs text-red-400 mt-1 hover:underline"
>
  Delete
</button>
</div>
                  </div>
                </div>
                {d.replies?.map(r => (
                  <div key={r.id} className="ml-10 mt-2 p-3 rounded-xl" style={{background:'rgba(255,255,255,0.03)'}}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white">{r.user_name}</span>
                      {r.user_role === 'teacher' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:'rgba(13,148,136,0.2)',color:'#2dd4bf'}}>Teacher</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-300">{r.message}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {courseTab==='review' && (
          <div className="flex-1 overflow-y-auto max-w-lg">
            <div className="glass rounded-2xl p-5 border border-white/5 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold text-white">{ratings.average || '—'}</div>
                <div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{fontSize:20,color:s<=Math.round(ratings.average)?'#fbbf24':'#374151'}}>★</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">{ratings.total} ratings</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold text-white mb-2">
                  {myRating.rating > 0 ? 'Your rating' : 'Rate this course'}
                </div>
                <div className="flex gap-2 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s}
                      onClick={() => setMyRating(r => ({...r, rating:s}))}
                      style={{fontSize:28,color:s<=myRating.rating?'#fbbf24':'#374151',background:'none',border:'none',cursor:'pointer'}}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea value={myRating.review}
                  onChange={e => setMyRating(r => ({...r, review:e.target.value}))}
                  className="input-base h-20 resize-none mb-2"
                  placeholder="Write a review (optional)..."/>
                <button onClick={async () => {
                  try {
                    await api.post('/ratings/', {
                      course_id: playingCourse.course_id,
                      rating: myRating.rating,
                      review: myRating.review
                    })
                    const r = await api.get(`/ratings/course/${playingCourse.course_id}`)
                    setRatings(r.data)
                    flash('Rating submitted! ⭐')
                  } catch(e) { flash(e.response?.data?.detail||'Error','error') }
                }} disabled={myRating.rating===0}
                  className="btn-primary text-white w-full py-2.5 rounded-xl text-sm disabled:opacity-40">
                  {myRating.rating > 0 ? 'Submit Rating' : 'Select stars first'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {ratings.ratings?.map(r => (
                <div key={r.id} className="glass rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full btn-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {r.user_name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white">{r.user_name}</span>
                    <div className="flex ml-auto">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{fontSize:12,color:s<=r.rating?'#fbbf24':'#374151'}}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.review && <div className="text-xs text-gray-300 mt-1">{r.review}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {courseTab==='contact' && (
          <div className="flex-1 max-w-lg">
            {teacherContact ? (
              <div className="space-y-3">
                <div className="glass rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl btn-primary flex items-center justify-center text-xl font-bold text-white shrink-0">
                      {teacherContact.teacher_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{teacherContact.teacher_name}</div>
                      <div className="text-sm text-gray-400">{teacherContact.teacher_email}</div>
                      {teacherContact.bio && <div className="text-xs text-gray-500 mt-1">{teacherContact.bio}</div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {teacherContact.phone && (
                      <a href={`tel:${teacherContact.phone}`}
                        className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:'rgba(59,130,246,0.2)'}}>📞</div>
                        <div>
                          <div className="text-xs text-gray-400">Phone</div>
                          <div className="text-sm text-white">{teacherContact.phone}</div>
                        </div>
                      </a>
                    )}
                    {teacherContact.whatsapp && (
                      <a href={`https://wa.me/${teacherContact.whatsapp.replace(/\D/g,'')}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:'rgba(37,211,102,0.2)'}}>💬</div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-400">WhatsApp</div>
                          <div className="text-sm text-white">{teacherContact.whatsapp}</div>
                        </div>
                        <span className="text-xs text-green-400">Open ↗</span>
                      </a>
                    )}
                    <a href={`mailto:${teacherContact.teacher_email}`}
                      className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:'rgba(124,58,237,0.2)'}}>✉️</div>
                      <div>
                        <div className="text-xs text-gray-400">Email</div>
                        <div className="text-sm text-white">{teacherContact.teacher_email}</div>
                      </div>
                    </a>
                    {teacherContact.office_hours && (
                      <div className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:'rgba(245,158,11,0.2)'}}>🕐</div>
                        <div>
                          <div className="text-xs text-gray-400">Office hours</div>
                          <div className="text-sm text-white">{teacherContact.office_hours}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl text-xs text-gray-400 text-center"
                  style={{background:'rgba(124,58,237,0.06)',border:'1px solid rgba(124,58,237,0.15)'}}>
                  Contact during office hours for best response
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center text-gray-600">
                  <div className="text-4xl mb-2">📞</div>
                  <div className="text-sm">Teacher hasn't added contact details yet</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {payingCourse && (
        <PaymentModal
          course={payingCourse}
          onClose={() => setPayingCourse(null)}
          onSuccess={() => { setPayingCourse(null); loadAll(); flash('Payment successful! 🎉') }}
        />
      )}

      <MobileLayout
        sidebar={sidebarContent}
        topbarTitle={tab.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}
        topbarSub={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        bottomNavItems={navItems}
        activeTab={tab}
        onTabChange={setTab}>

        {msg.text && (
          <div className={`mx-4 mt-3 text-sm px-4 py-2 rounded-xl border animate-fade-in ${msg.type==='error'?'bg-red-500/10 border-red-500/20 text-red-400':'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>
            {msg.text}
          </div>
        )}

        <div className="p-4">
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px',marginBottom:'16px'}}>
            {[
              {label:'Enrolled',value:enrollments.length,suffix:'',icon:'📚',color:'#8b5cf6'},
              {label:'Attendance',value:attendance?.rate||0,suffix:'%',icon:'🕐',color:'#34d399'},
              {label:'Quizzes',value:attempts.length,suffix:'',icon:'🧪',color:'#fbbf24'},
              {label:'Certs',value:certificates.length,suffix:'',icon:'🏅',color:'#60a5fa'},
              {label:'Streak',value:streak.current_streak,suffix:'🔥',icon:'',color:'#f97316'},
            ].map((s,i) => (
              <div key={s.label} style={{background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.05))',border:'1px solid rgba(124,58,237,0.2)',borderRadius:'14px',padding:'10px 6px',textAlign:'center'}}>
                <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
                <div style={{fontSize:18,fontWeight:700,color:s.color}}>
                  <AnimatedCounter value={s.value} suffix={s.suffix}/>
                </div>
                <div style={{fontSize:9,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>

          {tab==='courses' && (
            <div className="animate-fade-up">
              {/* Search bar */}
              <div className="relative mb-3">
                <div style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#6b7280',fontSize:16}}>🔍</div>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  style={{
                    width:'100%',
                    background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(255,255,255,0.1)',
                    borderRadius:14,
                    padding:'10px 14px 10px 40px',
                    color:'white',
                    fontSize:14,
                    outline:'none',
                    boxSizing:'border-box'
                  }}
                  onFocus={e => e.target.style.border='1px solid rgba(124,58,237,0.6)'}
                  onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.1)'}
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#6b7280',cursor:'pointer',fontSize:16}}>
                    ✕
                  </button>
                )}
              </div>

              {/* Category filter */}
              <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8,marginBottom:12,scrollbarWidth:'none'}}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    style={{
                      flexShrink:0,
                      padding:'6px 14px',
                      borderRadius:20,
                      fontSize:12,
                      fontWeight:500,
                      border:'none',
                      cursor:'pointer',
                      transition:'all 0.2s',
                      background: activeCategory===cat ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(255,255,255,0.06)',
                      color: activeCategory===cat ? 'white' : '#9ca3af',
                      boxShadow: activeCategory===cat ? '0 4px 15px rgba(124,58,237,0.3)' : 'none'
                    }}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Results count */}
              {(search || activeCategory !== 'All') && (
                <div style={{fontSize:12,color:'#6b7280',marginBottom:10}}>
                  {courses.filter(c => {
                    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
                    const matchCat = activeCategory === 'All' || c.category === activeCategory
                    return matchSearch && matchCat
                  }).length} courses found
                </div>
              )}

              {/* Course grid */}
              <div className="course-grid">
                {courses
                  .filter(c => {
                    const matchSearch = !search ||
                      c.title.toLowerCase().includes(search.toLowerCase()) ||
                      c.instructor?.toLowerCase().includes(search.toLowerCase()) ||
                      c.description?.toLowerCase().includes(search.toLowerCase())
                    const matchCat = activeCategory === 'All' || c.category === activeCategory
                    return matchSearch && matchCat
                  })
                  .map((c) => {
                    const enrolled = enrollments.find(e=>e.course_id===c.id)
                    return (
                      <div key={c.id}
                        className="card-base card-hover cursor-pointer"
                        style={{borderRadius:'14px',overflow:'hidden',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                        <div style={{position:'relative',height:'110px',background:'#1a1a2e',overflow:'hidden'}}>
                          {courseThumbnails[c.id] ? (
                            <img src={courseThumbnails[c.id]} alt={c.title}
                              style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.85)'}}
                              onError={e => { e.target.style.display='none' }}/>
                          ) : (
                            <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.2))'}}>
                              <span style={{fontSize:32}}>{c.is_paid?'💎':'🎓'}</span>
                            </div>
                          )}
                          <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.7))'}}/>
                          <div style={{position:'absolute',top:6,right:6}}>
                            {c.is_paid
                              ? <span style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'white',fontSize:9,padding:'2px 7px',borderRadius:20,fontWeight:600}}>₹{c.price}</span>
                              : <span style={{background:'rgba(52,211,153,0.2)',border:'1px solid rgba(52,211,153,0.4)',color:'#34d399',fontSize:9,padding:'2px 7px',borderRadius:20,fontWeight:600}}>FREE</span>
                            }
                          </div>
                          {c.category && c.category !== 'General' && (
                            <div style={{position:'absolute',top:6,left:6}}>
                              <span style={{background:'rgba(0,0,0,0.6)',color:'#a78bfa',fontSize:9,padding:'2px 7px',borderRadius:20}}>
                                {c.category}
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{padding:'10px 10px 8px'}}>
                          <div style={{fontWeight:600,color:'white',fontSize:12,lineHeight:'1.3',marginBottom:3,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                            {c.title}
                          </div>
                          <div style={{fontSize:10,color:'#9ca3af',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {c.instructor}
                          </div>
                                                    {/* Rating stars */}
                          <div className="flex items-center gap-1 mb-2">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} style={{fontSize:10, color: s <= Math.round(c.avg_rating||0) ? '#fbbf24' : '#374151'}}>★</span>
                            ))}
                            {c.avg_rating > 0 && (
                              <span style={{fontSize:10, color:'#9ca3af', marginLeft:2}}>
                                {c.avg_rating} ({c.total_ratings})
                              </span>
                            )}
                          </div>
                          <div style={{fontSize:10,color:'#6b7280',marginBottom:8}}>📦 {c.total_modules} modules</div>
                          {enrolled ? (
                            <div>
                              <div style={{height:3,borderRadius:10,background:'rgba(255,255,255,0.1)',marginBottom:6,overflow:'hidden'}}>
                                <div style={{height:'100%',borderRadius:10,background:'linear-gradient(90deg,#7c3aed,#06b6d4)',width:enrolled.progress+'%'}}/>
                              </div>
                              <button onClick={()=>openCourse(enrolled)}
                                style={{width:'100%',background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'white',border:'none',borderRadius:10,padding:'7px 0',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                                ▶ Continue
                              </button>
                            </div>
                          ) : c.is_paid ? (
                            <button onClick={()=>setPayingCourse(c)}
                              style={{width:'100%',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'white',border:'none',borderRadius:10,padding:'7px 0',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                              Buy · ₹{c.price}
                            </button>
                          ) : (
                            <button onClick={()=>enroll(c.id)}
                              style={{width:'100%',background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'white',border:'none',borderRadius:10,padding:'7px 0',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                              Enroll Free
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>

              {/* No results */}
              {courses.filter(c => {
                const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor?.toLowerCase().includes(search.toLowerCase())
                const matchCat = activeCategory === 'All' || c.category === activeCategory
                return matchSearch && matchCat
              }).length === 0 && (
                <div style={{textAlign:'center',padding:'40px 0'}}>
                  <div style={{fontSize:40,marginBottom:12}}>🔍</div>
                  <div style={{color:'#6b7280',fontSize:14}}>No courses found for "{search}"</div>
                  <button onClick={() => { setSearch(''); setActiveCategory('All') }}
                    style={{marginTop:12,background:'rgba(124,58,237,0.2)',color:'#a78bfa',border:'1px solid rgba(124,58,237,0.3)',borderRadius:10,padding:'8px 20px',fontSize:12,cursor:'pointer'}}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}

          {tab==='my-courses' && (
            <div className="animate-fade-up space-y-3">
              <div className="text-base font-semibold text-white mb-4">My Courses</div>
               {/* Upcoming live classes */}
              <UpcomingClasses />

              {/* existing course list */}
              {enrollments.length===0 && (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-3">📖</div>
                  <div className="text-gray-400 text-sm mb-3">No enrollments yet</div>
                  <button onClick={()=>setTab('courses')} className="btn-primary text-white px-5 py-2 rounded-xl text-sm">Browse →</button>
                </div>
              )}
              {enrollments.map(e => (
                <div key={e.enrollment_id} className="glass rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center text-lg shrink-0">🎓</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{e.course_title}</div>
                      <div className="text-xs text-gray-400 truncate">{e.instructor}</div>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${e.progress===100?'bg-green-500/20 text-green-400':'bg-violet-500/20 text-violet-400'}`}>
                      {e.progress===100?'✓':e.progress+'%'}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full mb-3" style={{background:'rgba(255,255,255,0.07)'}}>
                    <div className="h-1.5 rounded-full progress-bar" style={{width:e.progress+'%',background:'linear-gradient(90deg,#7c3aed,#06b6d4)'}}/>
                  </div>
                  <button onClick={()=>openCourse(e)} className="w-full btn-primary text-white py-2.5 rounded-xl text-sm font-medium">
                    ▶ Open Course
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab==='announcements' && (
            <div className="animate-fade-up space-y-3">
              <div className="text-base font-semibold text-white mb-4">Announcements</div>
              {announcements.length===0 && (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-2">📢</div>
                  <div className="text-gray-400 text-sm">No announcements yet</div>
                </div>
              )}
              {announcements.map(a => (
                <div key={a.id} className="rounded-2xl p-4" style={{background:'rgba(124,58,237,0.07)',border:'1px solid rgba(124,58,237,0.15)',borderLeft:'4px solid #7c3aed'}}>
                  <div className="font-semibold text-white mb-1 text-sm">{a.title}</div>
                  <div className="text-sm text-gray-300 mb-2 leading-relaxed">{a.body}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(124,58,237,0.2)',color:'#a78bfa'}}>{a.course}</span>
                    <span className="text-xs text-gray-500">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab==='assignments' && (
            <div className="animate-fade-up">
              <div className="text-base font-semibold text-white mb-4">My Submissions</div>
              {submissions.length===0 && (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-2">📝</div>
                  <div className="text-gray-400 text-sm">No submissions yet</div>
                </div>
              )}
              <div className="space-y-3">
                {submissions.map(s => (
                  <div key={s.id} className="glass rounded-xl p-4 border border-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">{s.assignment_title}</div>
                        <div className="text-xs text-gray-400 truncate">{s.course}</div>
                      </div>
                      {s.grade!==null ? (
                        <div className="text-right shrink-0">
                          <div className={`text-lg font-bold ${s.grade>=50?'text-green-400':'text-red-400'}`}>{s.grade}/100</div>
                          {s.feedback && <div className="text-xs text-gray-400">{s.feedback}</div>}
                        </div>
                      ) : <div className="text-xs text-amber-400 shrink-0">Pending</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='quizzes' && (
            <div className="animate-fade-up">
              <div className="text-base font-semibold text-white mb-4">Quiz Results</div>
              {attempts.length===0 && (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-2">🧪</div>
                  <div className="text-gray-400 text-sm">No quizzes taken yet</div>
                </div>
              )}
              <div className="space-y-3">
                {attempts.map(a => (
                  <div key={a.id} className="glass rounded-xl p-4 border border-white/5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">{a.quiz_title}</div>
                      <div className="text-xs text-gray-400 truncate">{a.course}</div>
                    </div>
                    <div className={`text-2xl font-bold shrink-0 ${a.percentage>=50?'text-green-400':'text-red-400'}`}>{a.percentage}%</div>
                    <div className={`text-xs px-2 py-1 rounded-full shrink-0 ${a.percentage>=50?'bg-green-500/15 text-green-400':'bg-red-500/15 text-red-400'}`}>
                      {a.percentage>=50?'Pass':'Fail'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='attendance' && (
            <div className="animate-fade-up">
              <div className="text-base font-semibold text-white mb-4">Attendance</div>
              {!attendance||attendance.total===0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-2">🕐</div>
                  <div className="text-gray-400 text-sm">No records yet</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="glass rounded-2xl p-6 border border-white/5 text-center">
                    <div className={`text-6xl font-bold mb-2 ${attendance.rate>=75?'text-green-400':'text-amber-400'}`}>
                      <AnimatedCounter value={attendance.rate} suffix="%"/>
                    </div>
                    <div className="text-sm text-gray-400 mb-4">
                      {attendance.present} present · {attendance.total-attendance.present} absent · {attendance.total} total
                    </div>
                    <div className="h-3 rounded-full" style={{background:'rgba(255,255,255,0.07)'}}>
                      <div className="h-3 rounded-full progress-bar"
                        style={{width:attendance.rate+'%',background:attendance.rate>=75?'#10b981':'#f59e0b'}}/>
                    </div>
                    <div className={`text-xs mt-2 ${attendance.rate>=75?'text-green-400':'text-amber-400'}`}>
                      {attendance.rate>=75?'✓ Good attendance':'⚠ Below 75%'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

         {/* CERTIFICATES */}
{tab === 'certificates' && (
  <div>
    <div className="text-sm font-medium text-gray-400 mb-3">My certificates</div>

    {certificates.length === 0 && (
      <div className="text-gray-500 text-sm">No certificates yet.</div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {certificates.map(c => {
        const issueDate = new Date(c.issued_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

        const certUrl = `${window.location.origin}/certificate/${c.id}`

        const downloadPDF = () => {
         const uniqueCode = `LRNL-${new Date(c.issued_at).getFullYear()}-${c.id}-${Math.random().toString(36).substring(2,8).toUpperCase()}`

const certificateHTML = `
<html>
<head>
<title>Learnly Certificate</title>

<style>
body{
  margin:0;
  padding:40px;
  background:#070312;
  font-family:Arial,sans-serif;
}

.cert{
  position:relative;
  overflow:hidden;
  border:2px solid #7c3aed;
  border-radius:28px;
  padding:70px;
  background:
    radial-gradient(circle at top left,#1f1147 0%,#090312 60%);
  color:white;
}

.cert:before{
  content:'';
  position:absolute;
  inset:0;
  background:
    linear-gradient(90deg,
    transparent,
    rgba(124,58,237,0.06),
    transparent);
}

.logo-wrap{
  display:flex;
  justify-content:center;
  align-items:center;
  gap:18px;
}

.logo{
  width:75px;
  height:75px;
  object-fit:contain;
}

.brand{
  font-size:72px;
  font-family:Georgia,serif;
  color:#c4b5fd;
}

.sub{
  text-align:center;
  letter-spacing:10px;
  color:#9ca3af;
  margin-top:10px;
  font-size:15px;
}

.medal{
  text-align:center;
  font-size:70px;
  margin:45px 0 25px;
}

.certifies{
  text-align:center;
  letter-spacing:8px;
  color:#cbd5e1;
  font-size:15px;
}

.name{
  text-align:center;
  font-size:90px;
  font-family:Georgia,serif;
  margin:30px 0;
}

.line{
  width:100%;
  height:2px;
  background:#7c3aed;
  margin:25px 0;
  position:relative;
}

.line:after{
  content:'✦';
  position:absolute;
  left:50%;
  top:-16px;
  transform:translateX(-50%);
  color:#c084fc;
  background:#0b0419;
  padding:0 14px;
  font-size:24px;
}

.complete{
  text-align:center;
  letter-spacing:8px;
  color:#9ca3af;
  font-size:14px;
}

.course{
  text-align:center;
  font-size:54px;
  font-weight:bold;
  margin-top:20px;
  color:#a78bfa;
}

.issue{
  text-align:center;
  color:#9ca3af;
  margin-top:30px;
  font-size:24px;
}

.bottom{
  margin-top:70px;
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  align-items:end;
  gap:40px;
}

.code-title{
  color:#cbd5e1;
  letter-spacing:5px;
  font-size:13px;
  margin-bottom:14px;
}

.code-box{
  border:2px solid #7c3aed;
  border-radius:14px;
  padding:16px;
  font-size:24px;
  color:white;
}

.verify-text{
  margin-top:18px;
  color:#a1a1aa;
  line-height:1.7;
  font-size:18px;
}

.verify-link{
  color:#a78bfa;
  font-weight:bold;
}

.verify-center{
  text-align:center;
}

.verify-badge{
  width:160px;
  margin-bottom:20px;
}

.verify-btn{
  display:inline-block;
  padding:14px 34px;
  border-radius:999px;
  border:2px solid #10b981;
  color:#10b981;
  font-size:24px;
  font-weight:bold;
}

.signature{
  width:280px;
  object-fit:contain;
  margin-bottom:10px;
}

.sign-line{
  border-top:2px solid #7c3aed;
  margin-top:10px;
  width:100%;
}

.founder{
  color:#a78bfa;
  font-size:32px;
  font-weight:bold;
  margin-top:14px;
}

.role{
  color:#9ca3af;
  letter-spacing:6px;
  margin-top:10px;
  font-size:14px;
}
</style>
</head>

<body>

<div class="cert">

<div class="logo-wrap">
  <img src="/logo.png" class="logo"/>
  <div class="brand">Learnly</div>
</div>

<div class="sub">
CERTIFICATE OF COMPLETION
</div>

<div class="medal">🏅</div>

<div class="certifies">
THIS CERTIFIES THAT
</div>

<div class="name">
${user?.name || 'Ganesh'}
</div>

<div class="line"></div>

<div class="complete">
HAS SUCCESSFULLY COMPLETED
</div>

<div class="course">
${c.course}
</div>

<div class="issue">
Issued on ${issueDate}
</div>

<div class="bottom">

<div>
<div class="code-title">
CERTIFICATE CODE
</div>

<div class="code-box">
${uniqueCode}
</div>

<div class="verify-text">
Use this code to verify authenticity at
<br/>
<span class="verify-link">
learnly.com/verify
</span>
</div>
</div>

<div class="verify-center">

<img
src="https://cdn-icons-png.flaticon.com/512/190/190411.png"
class="verify-badge"
/>

<div class="verify-btn">
✓ Verified by Learnly
</div>

</div>

<div style="text-align:center">

<img src="/signature.png" class="signature"/>

<div class="sign-line"></div>

<div class="founder">
Learnly Founder
</div>

<div class="role">
FOUNDER, LEARNLY
</div>

</div>

</div>

</div>

</body>
</html>
` 

          const printWindow = window.open('', '_blank')
          printWindow.document.write(certificateHTML)
          printWindow.document.close()

          setTimeout(() => {
            printWindow.print()
          }, 500)
        }

        const shareCertificate = async () => {
  const uniqueCode = `LRNL-${new Date(c.issued_at).getFullYear()}-${c.id}`

  const shareText =
    `🎓 I successfully completed "${c.course}" on Learnly.\n\n` +
    `Certificate Code: ${uniqueCode}\n` +
    `Verified by Learnly.`

  const linkedInAppUrl =
    `linkedin://shareArticle?mini=true&url=${encodeURIComponent(window.location.origin)}&title=${encodeURIComponent('Learnly Certificate')}`

  const linkedInWebUrl =
    `https://www.linkedin.com/feed/`

  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {

    navigator.clipboard.writeText(shareText)

    window.location.href = linkedInAppUrl

    setTimeout(() => {
      window.open(linkedInWebUrl, '_blank')
    }, 1500)

    alert(
      'Certificate text copied.\nPaste it into your LinkedIn post.'
    )

  } else {

    window.open(linkedInWebUrl, '_blank')

    navigator.clipboard.writeText(shareText)

    alert(
      'Certificate text copied.\nPaste it into your LinkedIn post.'
    )
  }
}

        return (
          <div
            key={c.id}
            className="bg-[#181c27] border border-purple-500/30 rounded-2xl p-6"
          >
            <div className="text-3xl mb-3">🏅</div>

            <div className="font-medium text-white mb-1">
              {c.course}
            </div>

            <div className="text-xs text-gray-400 mb-3">
              Issued {issueDate}
            </div>

            <div className="flex items-center gap-1.5 mb-5">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs text-green-400">Verified by Learnly</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium"
              >
                Download PDF
              </button>

              <button
                onClick={shareCertificate}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium"
              >
                Share / LinkedIn
              </button>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}

          {tab==='orders' && (
            <div className="animate-fade-up">
              <div className="text-base font-semibold text-white mb-4">Order History</div>
              {orders.length===0 && (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-2">💳</div>
                  <div className="text-gray-400 text-sm">No orders yet</div>
                </div>
              )}
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="glass rounded-xl p-4 border border-white/5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${o.status==='paid'?'bg-green-500/20':'bg-amber-500/20'}`}>
                      {o.status==='paid'?'✓':'⏳'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">{o.course}</div>
                      <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-white text-sm">₹{o.amount}</div>
                      <div className={`text-xs ${o.status==='paid'?'text-green-400':'text-amber-400'}`}>{o.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

         {tab==='ai-tutor' && (
            <div className="animate-fade-up flex justify-center">
              <div className="w-full max-w-2xl" style={{height:'calc(100vh - 200px)'}}>
                <div className="card-base p-4 h-full flex flex-col" style={{background:'rgba(13,13,26,0.8)'}}>
                  <div className="flex items-center gap-3 mb-3 pb-3 shrink-0" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    <div className="w-9 h-9 rounded-xl btn-primary flex items-center justify-center text-base">🤖</div>
                    <div>
                      <div className="font-semibold text-white text-sm">AI Tutor</div>
                      <div className="text-xs" style={{color:'var(--text3)'}}>Powered by Gemini · Ask anything</div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <AITutorChat/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab==='leaderboard' && (
            <div className="animate-fade-up">
              <LeaderboardTab />
            </div>
          )}

          {tab==='referral' && (
            <div className="animate-fade-up">
              <div className="text-base font-semibold text-white mb-4">Refer Friends</div>
              <div className="glass rounded-2xl p-5 border border-white/5 mb-4">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Your referral code</div>
                <div className="font-display text-3xl font-bold gradient-text tracking-widest mb-4">
                  {referral?.referral_code||'...'}
                </div>
                <div className="glass rounded-xl px-3 py-2 text-xs text-gray-300 mb-3 break-all border border-white/5">
                  {referral?.referral_link}
                </div>
                <button onClick={copyReferral} className="w-full btn-primary text-white py-3 rounded-xl font-semibold text-sm">
                  📋 Copy Referral Link
                </button>
              </div>
              <div className="glass rounded-xl p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm">Total referrals</div>
                  <div className="text-xs text-gray-400">Friends who joined</div>
                </div>
                <div className="text-3xl font-bold" style={{color:'#8b5cf6'}}>
                  <AnimatedCounter value={referral?.total_referrals||0}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </MobileLayout>
    </>
  )
}