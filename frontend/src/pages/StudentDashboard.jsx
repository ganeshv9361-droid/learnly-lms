import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import AnimatedCounter from '../components/AnimatedCounter'
import PaymentModal from '../components/PaymentModal'
import MobileLayout from '../components/MobileLayout'

function getYoutubeId(url) {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

const navItems = [
  ['courses','📚','Courses'],
  ['my-courses','📖','My Courses'],
  ['announcements','📢','Announcements'],
  ['assignments','📝','Assignments'],
  ['quizzes','🧪','Quizzes'],
  ['attendance','🕐','Attendance'],
  ['certificates','🏅','Certificates'],
  ['orders','💳','Orders'],
  ['referral','🔗','Refer Friends'],
]

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
  }

  useEffect(() => { loadAll() }, [])

  const enroll = async (course_id) => {
    try {
      await api.post('/enrollments/', { course_id })
      loadAll()
      flash('Enrolled successfully! 🎉')
    } catch(e) { flash(e.response?.data?.detail||'Error','error') }
  }

  const openCourse = async (enrollment) => {
    setPlayingCourse(enrollment)
    setActiveVideo(null)
    setQuizResult(null)
    setActiveQuiz(null)
    setCourseTab('videos')
    setTeacherContact(null)
    const [vids, asgn, qzs, contact] = await Promise.all([
      api.get(`/videos/course/${enrollment.course_id}`),
      api.get(`/assignments/course/${enrollment.course_id}`),
      api.get(`/quizzes/course/${enrollment.course_id}`),
      api.get(`/teacher-profile/course/${enrollment.course_id}/teacher-contact`).catch(() => ({data:null}))
    ])
    setVideos(vids.data)
    setAssignments(asgn.data)
    setQuizzes(qzs.data)
    setTeacherContact(contact.data)
    if (vids.data.length > 0) setActiveVideo(vids.data[0])
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
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#0a0a0f,#0f0a1f);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px;}
  .cert{background:linear-gradient(135deg,#13131f,#1a1030);border:1px solid rgba(124,58,237,0.3);border-radius:24px;padding:60px 80px;text-align:center;max-width:780px;width:100%;position:relative;overflow:hidden;}
  .cert::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#7c3aed,#06b6d4,#7c3aed);}
  .logo{font-family:'Playfair Display',serif;font-size:28px;color:#a78bfa;margin-bottom:8px;letter-spacing:2px;}
  .tagline{font-size:11px;color:#6b7280;letter-spacing:4px;text-transform:uppercase;margin-bottom:50px;}
  .badge{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 30px;}
  .name{font-family:'Playfair Display',serif;font-size:48px;color:#fff;margin-bottom:20px;border-bottom:1px solid rgba(124,58,237,0.3);padding-bottom:20px;}
  .course{font-size:26px;color:#a78bfa;font-weight:600;margin-bottom:40px;}
  .date{font-size:13px;color:#6b7280;margin-top:30px;}
  .verified{display:inline-flex;align-items:center;gap:8px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#34d399;padding:8px 20px;border-radius:50px;font-size:12px;margin-top:20px;}
</style>
</head>
<body>
<div class="cert">
  <div class="logo">✦ Learnly</div>
  <div class="tagline">Certificate of Completion</div>
  <div class="badge">🏅</div>
  <div style="font-size:12px;color:#9ca3af;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">This certifies that</div>
  <div class="name">${user.name}</div>
  <div style="font-size:12px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">has successfully completed</div>
  <div class="course">${cert.course}</div>
  <div class="date">Issued on ${new Date(cert.issued_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
  <div class="verified">✓ Verified by Learnly</div>
</div>
</body></html>`
    const blob = new Blob([html], { type:'text/html' })
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

  const sidebarContent = ({ closeSidebar }) => (
    <>
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-primary flex items-center justify-center shrink-0">
            <span className="font-display text-sm text-white font-bold">✦</span>
          </div>
          <span className="font-display text-lg font-bold gradient-text">Learnly</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(([key,icon,label]) => (
          <button key={key} onClick={() => { setTab(key); closeSidebar() }}
            className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${tab===key?'active':''}`}
            style={tab!==key?{color:'#6b7280'}:{}}>
            <span style={{fontSize:16}}>{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            {key==='announcements' && announcements.length>0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{background:'rgba(124,58,237,0.3)',color:'#a78bfa'}}>
                {announcements.length}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5">
        <div className="glass rounded-xl p-3 mb-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs" style={{color:'#8b5cf6'}}>Student</div>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
          <span>⏻</span> Sign out
        </button>
      </div>
    </>
  )

  if (playingCourse) return (
    <div className="min-h-screen flex flex-col" style={{background:'#0a0a0f'}}>
      <div className="glass border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={() => { setPlayingCourse(null); loadAll() }}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition text-sm shrink-0">
          ← Back
        </button>
        <div className="font-semibold text-white text-sm flex-1 min-w-0 truncate">{playingCourse.course_title}</div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          {[['videos','🎬'],['assignments','📝'],['quizzes','🧪'],['contact','📞']].map(([t,icon]) => (
            <button key={t} onClick={() => { setCourseTab(t); setActiveQuiz(null); setQuizResult(null) }}
              className={`text-xs px-3 py-2 rounded-xl transition flex-1 sm:flex-none ${courseTab===t?'btn-primary text-white':'text-gray-400 glass'}`}>
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

        {courseTab==='videos' && (
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
                  <div className="rounded-2xl overflow-hidden mb-3 shadow-2xl bg-black"
                    style={{aspectRatio:'16/9'}}>
                    {activeVideo.youtube_url ? (
                      <iframe key={activeVideo.id} width="100%" height="100%"
                        src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo.youtube_url)}?autoplay=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen className="w-full h-full"
                        onLoad={() => setTimeout(() => markVideoWatched(activeVideo), 30000)}/>
                    ) : (
                      <video key={activeVideo.id} controls autoPlay className="w-full h-full"
                        src={`https://learnly-lms-hqch.onrender.com${activeVideo.file_path}`}
                        onEnded={() => markVideoWatched(activeVideo)}/>
                    )}
                  </div>
                  <div className="glass rounded-xl p-3 border border-white/5">
                    <div className="font-semibold text-white text-sm">{activeVideo.title}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${activeVideo.youtube_url?'bg-red-500/15 text-red-400':'bg-blue-500/15 text-blue-400'}`}>
                      {activeVideo.youtube_url?'▶ YouTube':'▶ Uploaded'}
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
                {videos.length===0 && <div className="text-sm text-gray-600 text-center py-4">No videos yet</div>}
                {videos.map((v,i) => (
                  <div key={v.id} onClick={() => setActiveVideo(v)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${activeVideo?.id===v.id?'border-violet-500/40':'border-white/5 glass hover:border-white/15'}`}
                    style={activeVideo?.id===v.id?{background:'rgba(124,58,237,0.15)'}:{}}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${activeVideo?.id===v.id?'btn-primary text-white':''}`}
                      style={activeVideo?.id!==v.id?{background:'rgba(255,255,255,0.06)'}:{}}>
                      {activeVideo?.id===v.id?'▶':i+1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{v.title}</div>
                      <div className="text-xs text-gray-500">{v.youtube_url?'YouTube':'Uploaded'}</div>
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
        topbarSub={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}>

        {msg.text && (
          <div className={`mx-4 mt-3 text-sm px-4 py-2 rounded-xl border animate-fade-in ${msg.type==='error'?'bg-red-500/10 border-red-500/20 text-red-400':'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>
            {msg.text}
          </div>
        )}

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
            {[
              {label:'Enrolled',value:enrollments.length,suffix:'',icon:'📚',color:'#8b5cf6'},
              {label:'Attendance',value:attendance?.rate||0,suffix:'%',icon:'🕐',color:'#34d399'},
              {label:'Quizzes',value:attempts.length,suffix:'',icon:'🧪',color:'#fbbf24'},
              {label:'Certs',value:certificates.length,suffix:'',icon:'🏅',color:'#60a5fa'},
            ].map((s,i) => (
              <div key={s.label} className={`stat-card rounded-2xl p-4 animate-fade-up delay-${(i+1)*100}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wider truncate">{s.label}</div>
                  <div className="text-lg shrink-0">{s.icon}</div>
                </div>
                <div className="text-2xl font-bold" style={{color:s.color}}>
                  <AnimatedCounter value={s.value} suffix={s.suffix}/>
                </div>
              </div>
            ))}
          </div>

          {tab==='courses' && (
            <div className="animate-fade-up">
              <div className="text-base font-semibold text-white mb-4">Browse Courses</div>
              {courses.length===0 && (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-3">📚</div>
                  <div className="text-gray-400 text-sm">No courses yet</div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {courses.map((c) => {
                  const enrolled = enrollments.find(e=>e.course_id===c.id)
                  return (
                    <div key={c.id} className="glass rounded-2xl overflow-hidden border border-white/5 card-hover">
                      <div className="h-1.5" style={{background:enrolled?'linear-gradient(90deg,#7c3aed,#06b6d4)':c.is_paid?'linear-gradient(90deg,#f59e0b,#d97706)':'linear-gradient(90deg,#374151,#1f2937)'}}/>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-xl">{c.is_paid?'💎':'🎓'}</div>
                          {c.is_paid
                            ? <span className="paid-badge text-white text-xs px-2 py-1 rounded-full font-semibold shrink-0">₹{c.price}</span>
                            : <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0" style={{background:'rgba(52,211,153,0.15)',color:'#34d399'}}>FREE</span>
                          }
                        </div>
                        <div className="font-semibold text-white mb-1 text-sm">{c.title}</div>
                        <div className="text-xs text-gray-400 mb-1">by {c.instructor}</div>
                        <div className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</div>
                        <div className="text-xs text-gray-500 mb-3">📦 {c.total_modules} modules</div>
                        {enrolled ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>Progress</span><span>{enrolled.progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{background:'rgba(255,255,255,0.1)'}}>
                              <div className="h-1.5 rounded-full progress-bar" style={{width:enrolled.progress+'%',background:'linear-gradient(90deg,#7c3aed,#06b6d4)'}}/>
                            </div>
                            <button onClick={()=>openCourse(enrolled)} className="w-full btn-primary text-white py-2.5 rounded-xl text-sm font-medium">
                              ▶ Continue
                            </button>
                          </div>
                        ) : c.is_paid ? (
                          <button onClick={()=>setPayingCourse(c)} className="w-full text-white py-2.5 rounded-xl text-sm font-semibold"
                            style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',boxShadow:'0 4px 15px rgba(245,158,11,0.3)'}}>
                            Buy Now · ₹{c.price}
                          </button>
                        ) : (
                          <button onClick={()=>enroll(c.id)} className="w-full btn-primary text-white py-2.5 rounded-xl text-sm font-medium">
                            Enroll Free →
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab==='my-courses' && (
            <div className="animate-fade-up space-y-3">
              <div className="text-base font-semibold text-white mb-4">My Courses</div>
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
                      <div className={`h-3 rounded-full progress-bar`}
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

          {tab==='certificates' && (
            <div className="animate-fade-up">
              <div className="text-base font-semibold text-white mb-4">My Certificates</div>
              {certificates.length===0 && (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-2">🏅</div>
                  <div className="text-gray-400 text-sm">No certificates yet</div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {certificates.map(c => (
                  <div key={c.id} className="rounded-2xl p-5 card-hover"
                    style={{background:'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(217,119,6,0.05))',border:'1px solid rgba(245,158,11,0.2)'}}>
                    <div className="text-3xl mb-3">🏅</div>
                    <div className="font-semibold text-white mb-1 text-sm">{c.course}</div>
                    <div className="text-xs text-gray-400 mb-3">
                      {new Date(c.issued_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-green-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>Verified
                      </div>
                      <button onClick={()=>downloadCert(c)}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{background:'rgba(124,58,237,0.2)',color:'#a78bfa'}}>
                        ⬇ Download
                      </button>
                    </div>
                  </div>
                ))}
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