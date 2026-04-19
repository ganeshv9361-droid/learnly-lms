import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import AnimatedCounter from '../components/AnimatedCounter'
import PaymentModal from '../components/PaymentModal'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const flash = (text, type='success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text:'', type:'success' }), 3500)
  }

  const loadAll = () => {
    api.get('/courses/').then(r => setCourses(r.data))
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

  const [teacherContact, setTeacherContact] = useState(null)

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
  .certify{font-size:12px;color:#9ca3af;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;}
  .name{font-family:'Playfair Display',serif;font-size:48px;color:#fff;margin-bottom:20px;border-bottom:1px solid rgba(124,58,237,0.3);padding-bottom:20px;}
  .completed{font-size:12px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;}
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
  <div class="certify">This certifies that</div>
  <div class="name">${user.name}</div>
  <div class="completed">has successfully completed</div>
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

  if (playingCourse) return (
    <div className="min-h-screen flex flex-col" style={{background:'#0a0a0f'}}>
      <div className="glass border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => { setPlayingCourse(null); loadAll() }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>
        <div className="ml-auto flex gap-2">
          {[['videos','🎬 Videos'],['assignments','📝 Work'],['quizzes','🧪 Quizzes'],['contact','📞 Contact']].map(([t,label]) => (
            <button key={t} onClick={() => { setCourseTab(t); setActiveQuiz(null); setQuizResult(null) }}
              className={`text-sm px-4 py-2 rounded-xl transition-all duration-200 ${courseTab===t
                ? 'btn-primary text-white'
                : 'text-gray-400 hover:text-white glass'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-white/10"/>
        <div className="font-semibold text-white">{playingCourse.course_title}</div>
        <div className="ml-auto flex gap-2">
          {[['videos','🎬 Videos'],['assignments','📝 Work'],['quizzes','🧪 Quizzes']].map(([t,label]) => (
            <button key={t} onClick={() => { setCourseTab(t); setActiveQuiz(null); setQuizResult(null) }}
              className={`text-sm px-4 py-2 rounded-xl transition-all duration-200 ${courseTab===t
                ? 'btn-primary text-white'
                : 'text-gray-400 hover:text-white glass'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {msg.text && (
        <div className={`mx-6 mt-3 text-sm px-4 py-3 rounded-xl border animate-fade-in ${msg.type==='error'
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-violet-500/10 border-violet-500/20 text-violet-300'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-1 p-6 gap-6">
        {courseTab==='videos' && (
          <>
            <div className="flex-1">
              {!activeVideo ? (
                <div className="glass rounded-2xl h-72 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-3">🎬</div>
                    <div className="text-sm">No videos yet</div>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="rounded-2xl overflow-hidden mb-4 shadow-2xl" style={{aspectRatio:'16/9', background:'#000'}}>
                    {activeVideo.youtube_url ? (
                      <iframe key={activeVideo.id} width="100%" height="100%"
                        src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo.youtube_url)}?autoplay=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen className="w-full h-full"/>
                    ) : (
                      <video key={activeVideo.id} controls autoPlay className="w-full h-full"
                        src={`http://localhost:8000${activeVideo.file_path}`}/>
                    )}
                  </div>
                  <div className="glass rounded-xl p-4 border border-white/5">
                    <div className="font-semibold text-white mb-1">{activeVideo.title}</div>
                    <span className={`text-xs px-3 py-1 rounded-full ${activeVideo.youtube_url?'bg-red-500/15 text-red-400':'bg-blue-500/15 text-blue-400'}`}>
                      {activeVideo.youtube_url?'▶ YouTube':'▶ Uploaded'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="w-72 shrink-0">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 px-1">
                Playlist · {videos.length} videos
              </div>
              <div className="flex flex-col gap-2">
                {videos.length===0 && (
                  <div className="text-sm text-gray-600 text-center py-8">No videos yet</div>
                )}
                {videos.map((v,i) => (
                  <div key={v.id} onClick={() => setActiveVideo(v)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-200 ${activeVideo?.id===v.id
                      ? 'border-violet-500/40 text-white'
                      : 'border-white/5 text-gray-400 hover:border-white/15 glass'}`}
                    style={activeVideo?.id===v.id ? {background:'rgba(124,58,237,0.15)'} : {}}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${activeVideo?.id===v.id?'btn-primary text-white':''}`}
                      style={activeVideo?.id!==v.id ? {background:'rgba(255,255,255,0.06)'} : {}}>
                      {activeVideo?.id===v.id ? '▶' : i+1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate font-medium">{v.title}</div>
                      <div className="text-xs text-gray-600">{v.youtube_url?'YouTube':'Uploaded'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {courseTab==='assignments' && (
          <div className="flex-1 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Assignments</div>
              {assignments.length===0 && (
                <div className="glass rounded-xl p-8 text-center text-gray-600">
                  <div className="text-3xl mb-2">📝</div>No assignments yet
                </div>
              )}
              {assignments.map(a => {
                const submitted = submissions.find(s => s.assignment_id===a.id)
                return (
                  <div key={a.id} className="glass rounded-xl p-5 border border-white/5 card-hover">
                    <div className="font-medium text-white mb-1">{a.title}</div>
                    <div className="text-xs text-gray-400 mb-3">{a.description}</div>
                    {a.google_form_url && (
                      <a href={a.google_form_url} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 block mb-2 transition">
                        📋 Open Google Form ↗
                      </a>
                    )}
                    {a.due_date && (
                      <div className="text-xs text-amber-400 mb-3 flex items-center gap-1">
                        ⏰ Due: {new Date(a.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {submitted ? (
                      <div className="space-y-1">
                        <div className="text-xs text-green-400 flex items-center gap-1">✓ Submitted</div>
                        {submitted.grade!==null && (
                          <div className="text-xs" style={{color:'#a78bfa'}}>
                            Grade: {submitted.grade}/100{submitted.feedback ? ` — ${submitted.feedback}` : ''}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button onClick={()=>setSubmitForm({...submitForm,assignment_id:a.id})}
                        className="text-xs px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                        style={{background:'rgba(124,58,237,0.2)',color:'#a78bfa',border:'1px solid rgba(124,58,237,0.3)'}}>
                        Upload Submission
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {submitForm.assignment_id && (
              <div className="glass rounded-xl p-5 border border-violet-500/20 animate-fade-in">
                <div className="text-sm font-semibold text-white mb-4">📎 Submit Assignment</div>
                <form onSubmit={submitAssignment} className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wide">Note to teacher</label>
                    <textarea value={submitForm.note}
                      onChange={e=>setSubmitForm({...submitForm,note:e.target.value})}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none h-24 resize-none"
                      style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}
                      placeholder="Any notes for your teacher..."/>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wide">File upload</label>
                    <input ref={fileRef} required type="file"
                      onChange={e=>setSubmitForm({...submitForm,file:e.target.files[0]})}
                      className="w-full rounded-xl px-4 py-3 text-sm text-gray-300"
                      style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}/>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 btn-primary text-white py-2.5 rounded-xl text-sm font-medium">Submit</button>
                    <button type="button" onClick={()=>setSubmitForm({assignment_id:'',note:'',file:null})}
                      className="px-4 py-2.5 rounded-xl text-sm text-gray-400 glass">Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {courseTab==='quizzes' && (
          <div className="flex-1">
            {quizResult && (
              <div className="max-w-md mx-auto text-center animate-fade-up">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-6 ${quizResult.passed?'bg-green-500/20 border-2 border-green-500':'bg-red-500/20 border-2 border-red-500'}`}>
                  {quizResult.percentage}%
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {quizResult.score} / {quizResult.total} correct
                </div>
                <div className={`text-sm mb-6 ${quizResult.passed?'text-green-400':'text-red-400'}`}>
                  {quizResult.passed?'🎉 Excellent! You passed!':'Keep practicing, you got this!'}
                </div>
                <button onClick={()=>setQuizResult(null)} className="btn-primary text-white px-8 py-3 rounded-xl font-semibold">
                  Back to quizzes
                </button>
              </div>
            )}

            {activeQuiz && !quizResult && (
              <div className="max-w-2xl animate-fade-in">
                <div className="text-lg font-semibold text-white mb-2">{activeQuiz.title}</div>
                <div className="text-xs text-gray-500 mb-6">{questions.length} questions · Answer all to submit</div>
                <div className="space-y-4">
                  {questions.map((q,i) => (
                    <div key={q.id} className="glass rounded-xl p-5 border border-white/5">
                      <div className="text-sm text-white font-medium mb-4">{i+1}. {q.question}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {['A','B','C','D'].map(opt => (
                          <button key={opt} type="button"
                            onClick={()=>setAnswers({...answers,[q.id]:opt})}
                            className={`text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 border ${answers[q.id]===opt
                              ? 'border-violet-500 text-white font-medium'
                              : 'border-white/10 text-gray-300 hover:border-white/20 glass'}`}
                            style={answers[q.id]===opt ? {background:'rgba(124,58,237,0.3)'} : {}}>
                            <span className="font-bold mr-2 text-violet-400">{opt}.</span>
                            {q[`option_${opt.toLowerCase()}`]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={submitQuiz}
                    disabled={Object.keys(answers).length<questions.length}
                    className="btn-primary text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-40 transition-all">
                    Submit Quiz ({Object.keys(answers).length}/{questions.length})
                  </button>
                  <button onClick={()=>setActiveQuiz(null)} className="glass text-gray-400 px-6 py-3 rounded-xl text-sm hover:text-white transition">
                    Cancel
                  </button>
                  {courseTab==='contact' && teacherContact && (
          <div className="flex-1 animate-fade-in max-w-lg">
            <div className="glass rounded-2xl p-6 border border-white/5 mb-4">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl btn-primary flex items-center justify-center text-2xl font-bold text-white">
                  {teacherContact.teacher_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white text-lg">{teacherContact.teacher_name}</div>
                  <div className="text-sm text-gray-400">{teacherContact.teacher_email}</div>
                  {teacherContact.bio && (
                    <div className="text-xs text-gray-500 mt-1 max-w-xs">{teacherContact.bio}</div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {teacherContact.phone && (
                  <a href={`tel:${teacherContact.phone}`}
                    className="flex items-center gap-3 p-3 rounded-xl transition card-hover glass border border-white/5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{background:'rgba(59,130,246,0.2)'}}>📞</div>
                    <div>
                      <div className="text-xs text-gray-400">Phone</div>
                      <div className="text-sm text-white font-medium">{teacherContact.phone}</div>
                    </div>
                  </a>
                )}
                {teacherContact.whatsapp && (
                  <a href={`https://wa.me/${teacherContact.whatsapp.replace(/\D/g,'')}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl transition card-hover glass border border-white/5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{background:'rgba(37,211,102,0.2)'}}>💬</div>
                    <div>
                      <div className="text-xs text-gray-400">WhatsApp</div>
                      <div className="text-sm text-white font-medium">{teacherContact.whatsapp}</div>
                    </div>
                    <div className="ml-auto text-xs text-green-400">Open ↗</div>
                  </a>
                )}
                <a href={`mailto:${teacherContact.teacher_email}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition card-hover glass border border-white/5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{background:'rgba(124,58,237,0.2)'}}>✉️</div>
                  <div>
                    <div className="text-xs text-gray-400">Email</div>
                    <div className="text-sm text-white font-medium">{teacherContact.teacher_email}</div>
                  </div>
                </a>
                {teacherContact.office_hours && (
                  <div className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{background:'rgba(245,158,11,0.2)'}}>🕐</div>
                    <div>
                      <div className="text-xs text-gray-400">Office hours</div>
                      <div className="text-sm text-white font-medium">{teacherContact.office_hours}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 rounded-xl text-xs text-gray-400 text-center"
              style={{background:'rgba(124,58,237,0.06)',border:'1px solid rgba(124,58,237,0.15)'}}>
              Contact your teacher only during office hours for the best response
            </div>
          </div>
        )}
        {courseTab==='contact' && !teacherContact && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-4xl mb-3">📞</div>
              <div className="text-sm">Teacher hasn't added contact details yet</div>
            </div>
          </div>
        )}
                </div>
              </div>
            )}

            {!activeQuiz && !quizResult && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Available quizzes</div>
                {quizzes.length===0 && (
                  <div className="glass rounded-xl p-8 text-center text-gray-600">
                    <div className="text-3xl mb-2">🧪</div>No quizzes yet
                  </div>
                )}
                <div className="space-y-3">
                  {quizzes.map(q => {
                    const attempted = attempts.find(a=>a.quiz_title===q.title)
                    return (
                      <div key={q.id} className="glass rounded-xl p-5 border border-white/5 card-hover flex items-center gap-4">
                        <div>
                          <div className="font-medium text-white">{q.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {q.google_form_url?'Google Form':`${q.question_count} questions`}
                          </div>
                        </div>
                        <div className="ml-auto">
                          {q.google_form_url ? (
                            <a href={q.google_form_url} target="_blank" rel="noreferrer"
                              className="text-sm px-4 py-2 rounded-xl transition"
                              style={{background:'rgba(59,130,246,0.2)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.3)'}}>
                              Open Form ↗
                            </a>
                          ) : attempted ? (
                            <div className="text-right">
                              <div className={`text-xl font-bold ${attempted.percentage>=50?'text-green-400':'text-red-400'}`}>
                                {attempted.percentage}%
                              </div>
                              <div className="text-xs text-gray-500">Completed</div>
                            </div>
                          ) : (
                            <button onClick={()=>startQuiz(q)} className="btn-primary text-white px-5 py-2 rounded-xl text-sm font-medium">
                              Start →
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{background:'#0a0a0f'}}>
      {payingCourse && (
        <PaymentModal
          course={payingCourse}
          onClose={() => setPayingCourse(null)}
          onSuccess={() => { setPayingCourse(null); loadAll(); flash('Payment successful! You are now enrolled 🎉') }}
        />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen?'w-60':'w-16'} transition-all duration-300 shrink-0 border-r border-white/5 flex flex-col`}
        style={{background:'rgba(10,10,15,0.95)', backdropFilter:'blur(20px)'}}>
        <div className="p-4 border-b border-white/5">
          <div className={`flex items-center gap-3 ${!sidebarOpen&&'justify-center'}`}>
            <div className="w-9 h-9 rounded-xl btn-primary flex items-center justify-center shrink-0">
              <span className="font-display text-sm text-white font-bold">✦</span>
            </div>
            {sidebarOpen && <span className="font-display text-lg font-bold gradient-text">Learnly</span>}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(([key,icon,label]) => (
            <button key={key} onClick={()=>setTab(key)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${tab===key?'active':''} ${!sidebarOpen&&'justify-center'}`}
              style={tab!==key ? {color:'#6b7280'} : {}}>
              <span style={{fontSize:16}}>{icon}</span>
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">{label}</span>
                  {key==='announcements' && announcements.length>0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{background:'rgba(124,58,237,0.3)',color:'#a78bfa'}}>
                      {announcements.length}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          {sidebarOpen && (
            <div className="glass rounded-xl p-3 mb-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                <div className="text-xs" style={{color:'#8b5cf6'}}>Student</div>
              </div>
            </div>
          )}
          <button onClick={logout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all ${!sidebarOpen&&'justify-center'}`}>
            <span>⏻</span>
            {sidebarOpen && 'Sign out'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-20 px-6 py-4 flex items-center gap-4 border-b border-white/5"
          style={{background:'rgba(10,10,15,0.9)', backdropFilter:'blur(20px)'}}>
          <button onClick={()=>setSidebarOpen(s=>!s)}
            className="text-gray-400 hover:text-white transition text-lg">☰</button>
          <div className="flex-1">
            <div className="font-semibold text-white capitalize">{tab.replace('-',' ')}</div>
            <div className="text-xs text-gray-500">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
          </div>
          {msg.text && (
            <div className={`text-sm px-4 py-2 rounded-xl border animate-fade-in ${msg.type==='error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-violet-500/10 border-violet-500/20 text-violet-300'}`}>
              {msg.text}
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              {label:'Enrolled', value:enrollments.length, suffix:'', icon:'📚', color:'#8b5cf6'},
              {label:'Attendance', value:attendance?.rate||0, suffix:'%', icon:'🕐', color:'#34d399'},
              {label:'Quizzes done', value:attempts.length, suffix:'', icon:'🧪', color:'#fbbf24'},
              {label:'Certificates', value:certificates.length, suffix:'', icon:'🏅', color:'#60a5fa'},
            ].map((s,i) => (
              <div key={s.label} className={`stat-card rounded-2xl p-5 animate-fade-up delay-${(i+1)*100}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</div>
                  <div className="text-xl">{s.icon}</div>
                </div>
                <div className="text-3xl font-bold animate-count" style={{color:s.color}}>
                  <AnimatedCounter value={s.value} suffix={s.suffix}/>
                </div>
              </div>
            ))}
          </div>

          {/* COURSES */}
          {tab==='courses' && (
            <div className="animate-fade-up">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-lg font-semibold text-white">Browse Courses</div>
                  <div className="text-xs text-gray-500 mt-0.5">{courses.length} courses available</div>
                </div>
              </div>
              {courses.length===0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">📚</div>
                  <div className="text-gray-400">No courses available yet</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-5">
                {courses.map((c,i) => {
                  const enrolled = enrollments.find(e=>e.course_id===c.id)
                  return (
                    <div key={c.id} className={`glass rounded-2xl overflow-hidden border border-white/5 card-hover animate-fade-up delay-${(i%4+1)*100}`}>
                      <div className="h-2" style={{background:enrolled?'linear-gradient(90deg,#7c3aed,#06b6d4)':c.is_paid?'linear-gradient(90deg,#f59e0b,#d97706)':'linear-gradient(90deg,#374151,#1f2937)'}}/>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="text-2xl">{c.is_paid?'💎':'🎓'}</div>
                          {c.is_paid ? (
                            <span className="paid-badge text-white text-xs px-3 py-1 rounded-full font-semibold">
                              ₹{c.price}
                            </span>
                          ) : (
                            <span className="text-xs px-3 py-1 rounded-full font-semibold"
                              style={{background:'rgba(52,211,153,0.15)',color:'#34d399'}}>
                              FREE
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-white mb-1 text-base">{c.title}</div>
                        <div className="text-xs text-gray-400 mb-1">by {c.instructor}</div>
                        <div className="text-xs text-gray-500 mb-4 line-clamp-2">{c.description}</div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                          <span>📦 {c.total_modules} modules</span>
                        </div>
                        {enrolled ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>Progress</span><span>{enrolled.progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{background:'rgba(255,255,255,0.1)'}}>
                              <div className="h-1.5 rounded-full progress-bar" style={{width:enrolled.progress+'%', background:'linear-gradient(90deg,#7c3aed,#06b6d4)'}}/>
                            </div>
                            <button onClick={()=>openCourse(enrolled)}
                              className="w-full btn-primary text-white py-2.5 rounded-xl text-sm font-medium mt-2">
                              ▶ Continue Learning
                            </button>
                          </div>
                        ) : c.is_paid ? (
                          <button onClick={()=>setPayingCourse(c)}
                            className="w-full text-white py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                            style={{background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 4px 15px rgba(245,158,11,0.3)'}}>
                            Buy Now · ₹{c.price}
                          </button>
                        ) : (
                          <button onClick={()=>enroll(c.id)}
                            className="w-full btn-primary text-white py-2.5 rounded-xl text-sm font-medium">
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
            <div className="animate-fade-up space-y-4">
              <div className="text-lg font-semibold text-white mb-5">My Courses</div>
              {enrollments.length===0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">📖</div>
                  <div className="text-gray-400 mb-4">No enrollments yet</div>
                  <button onClick={()=>setTab('courses')} className="btn-primary text-white px-6 py-2.5 rounded-xl text-sm">
                    Browse courses →
                  </button>
                </div>
              )}
              {enrollments.map(e => (
                <div key={e.enrollment_id} className="glass rounded-2xl p-5 border border-white/5 card-hover">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl btn-primary flex items-center justify-center text-xl shrink-0">🎓</div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{e.course_title}</div>
                      <div className="text-xs text-gray-400">{e.instructor}</div>
                    </div>
                    <button onClick={()=>openCourse(e)}
                      className="btn-primary text-white px-4 py-2 rounded-xl text-sm font-medium">
                      ▶ Open
                    </button>
                    <div className={`text-sm font-bold px-4 py-1.5 rounded-full ${e.progress===100?'bg-green-500/20 text-green-400':e.progress>=50?'bg-violet-500/20 text-violet-400':'glass text-gray-400'}`}>
                      {e.progress===100?'✓ Done':e.progress+'%'}
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{background:'rgba(255,255,255,0.07)'}}>
                    <div className="h-2 rounded-full progress-bar" style={{width:e.progress+'%', background:'linear-gradient(90deg,#7c3aed,#06b6d4)'}}/>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{Math.round(e.progress/100*(e.total_modules||0))} / {e.total_modules} modules</span>
                    <span>{e.progress}% complete</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab==='announcements' && (
            <div className="animate-fade-up">
              <div className="text-lg font-semibold text-white mb-5">Announcements</div>
              {announcements.length===0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">📢</div>
                  <div className="text-gray-400">No announcements yet</div>
                </div>
              )}
              <div className="space-y-4">
                {announcements.map((a,i) => (
                  <div key={a.id} className={`rounded-2xl p-5 border-l-4 animate-slide-left delay-${i*100}`}
                    style={{background:'rgba(124,58,237,0.07)', borderLeftColor:'#7c3aed', border:'1px solid rgba(124,58,237,0.15)', borderLeft:'4px solid #7c3aed'}}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-2">{a.title}</div>
                        <div className="text-sm text-gray-300 mb-3 leading-relaxed">{a.body}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-3 py-1 rounded-full"
                            style={{background:'rgba(124,58,237,0.2)', color:'#a78bfa'}}>
                            {a.course}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(a.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl">📢</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='assignments' && (
            <div className="animate-fade-up">
              <div className="text-lg font-semibold text-white mb-5">My Submissions</div>
              {submissions.length===0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">📝</div>
                  <div className="text-gray-400">No submissions yet. Open a course to submit assignments.</div>
                </div>
              )}
              <div className="space-y-3">
                {submissions.map(s => (
                  <div key={s.id} className="glass rounded-xl p-5 border border-white/5 card-hover flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{background:s.grade!==null?'rgba(52,211,153,0.2)':'rgba(251,191,36,0.2)'}}>
                      <span>{s.grade!==null?'✓':'⏳'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{s.assignment_title}</div>
                      <div className="text-xs text-gray-400">{s.course}</div>
                    </div>
                    <div className="text-right">
                      {s.grade!==null ? (
                        <div>
                          <div className={`text-xl font-bold ${s.grade>=50?'text-green-400':'text-red-400'}`}>{s.grade}/100</div>
                          {s.feedback && <div className="text-xs text-gray-400 mt-0.5">{s.feedback}</div>}
                        </div>
                      ) : <div className="text-xs text-amber-400 font-medium">Awaiting grade</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='quizzes' && (
            <div className="animate-fade-up">
              <div className="text-lg font-semibold text-white mb-5">Quiz Results</div>
              {attempts.length===0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">🧪</div>
                  <div className="text-gray-400">No quizzes taken yet. Open a course to start.</div>
                </div>
              )}
              <div className="space-y-3">
                {attempts.map(a => (
                  <div key={a.id} className="glass rounded-xl p-5 border border-white/5 card-hover flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-white">{a.quiz_title}</div>
                      <div className="text-xs text-gray-400">{a.course}</div>
                    </div>
                    <div className={`text-3xl font-bold ${a.percentage>=50?'text-green-400':'text-red-400'}`}>
                      {a.percentage}%
                    </div>
                    <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${a.percentage>=50?'bg-green-500/15 text-green-400':'bg-red-500/15 text-red-400'}`}>
                      {a.percentage>=50?'Passed':'Failed'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='attendance' && (
            <div className="animate-fade-up">
              <div className="text-lg font-semibold text-white mb-5">Attendance</div>
              {!attendance||attendance.total===0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">🕐</div>
                  <div className="text-gray-400">No records yet. Your teacher will mark attendance.</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="glass rounded-2xl p-8 border border-white/5">
                    <div className="text-center mb-6">
                      <div className={`text-7xl font-bold mb-2 ${attendance.rate>=75?'text-green-400':'text-amber-400'}`}>
                        <AnimatedCounter value={attendance.rate} suffix="%"/>
                      </div>
                      <div className="text-gray-400 text-sm">Overall attendance rate</div>
                    </div>
                    <div className="h-4 rounded-full mb-3" style={{background:'rgba(255,255,255,0.07)'}}>
                      <div className={`h-4 rounded-full progress-bar ${attendance.rate>=75?'':'bg-amber-500'}`}
                        style={{width:attendance.rate+'%', background:attendance.rate>=75?'linear-gradient(90deg,#10b981,#34d399)':undefined}}/>
                    </div>
                    <div className={`text-center text-sm font-medium ${attendance.rate>=75?'text-green-400':'text-amber-400'}`}>
                      {attendance.rate>=75?'✓ Excellent attendance!':'⚠ Below 75% minimum'}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      {label:'Total sessions', value:attendance.total, color:'text-white'},
                      {label:'Present', value:attendance.present, color:'text-green-400'},
                      {label:'Absent', value:attendance.total-attendance.present, color:'text-red-400'},
                    ].map(s => (
                      <div key={s.label} className="glass rounded-xl p-5 border border-white/5">
                        <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                        <div className={`text-3xl font-bold ${s.color}`}>
                          <AnimatedCounter value={s.value}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab==='certificates' && (
            <div className="animate-fade-up">
              <div className="text-lg font-semibold text-white mb-5">My Certificates</div>
              {certificates.length===0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">🏅</div>
                  <div className="text-gray-400">No certificates yet. Complete a course to earn one!</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-5">
                {certificates.map((c,i) => (
                  <div key={c.id} className={`rounded-2xl p-6 border animate-fade-up delay-${(i+1)*100} card-hover relative overflow-hidden`}
                    style={{background:'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(217,119,6,0.05))', borderColor:'rgba(245,158,11,0.2)'}}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                      style={{background:'radial-gradient(circle,#f59e0b,transparent)', transform:'translate(30%,-30%)'}}/>
                    <div className="text-4xl mb-4">🏅</div>
                    <div className="font-semibold text-white text-lg mb-1">{c.course}</div>
                    <div className="text-xs text-gray-400 mb-4">
                      Issued {new Date(c.issued_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                        Verified
                      </div>
                      <button onClick={()=>downloadCert(c)}
                        className="text-xs px-4 py-2 rounded-xl font-medium transition-all hover:scale-105"
                        style={{background:'rgba(124,58,237,0.2)',color:'#a78bfa',border:'1px solid rgba(124,58,237,0.3)'}}>
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
              <div className="text-lg font-semibold text-white mb-5">Order History</div>
              {orders.length===0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">💳</div>
                  <div className="text-gray-400">No orders yet. Purchase a paid course to get started.</div>
                </div>
              )}
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="glass rounded-xl p-5 border border-white/5 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${o.status==='paid'?'bg-green-500/20':'bg-amber-500/20'}`}>
                      <span>{o.status==='paid'?'✓':'⏳'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{o.course}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                      </div>
                      {o.razorpay_payment_id && (
                        <div className="text-xs text-gray-600 mt-0.5">ID: {o.razorpay_payment_id}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">₹{o.amount}</div>
                      <div className={`text-xs mt-0.5 font-medium ${o.status==='paid'?'text-green-400':'text-amber-400'}`}>
                        {o.status==='paid'?'Paid':'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='referral' && (
            <div className="animate-fade-up max-w-lg">
              <div className="text-lg font-semibold text-white mb-5">Refer Friends</div>
              <div className="glass rounded-2xl p-8 border border-white/5 mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
                  style={{background:'radial-gradient(circle,#7c3aed,transparent)', transform:'translate(30%,-30%)'}}/>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Your referral code</div>
                <div className="font-display text-4xl font-bold gradient-text tracking-widest mb-6">
                  {referral?.referral_code||'...'}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Share this link</div>
                <div className="glass rounded-xl px-4 py-3 text-xs text-gray-300 mb-4 break-all border border-white/5">
                  {referral?.referral_link}
                </div>
                <button onClick={copyReferral}
                  className="w-full btn-primary text-white py-3 rounded-xl font-semibold text-sm">
                  📋 Copy Referral Link
                </button>
              </div>
              <div className="glass rounded-xl p-5 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white mb-1">Total referrals</div>
                    <div className="text-xs text-gray-400">Friends who joined using your link</div>
                  </div>
                  <div className="text-3xl font-bold" style={{color:'#8b5cf6'}}>
                    <AnimatedCounter value={referral?.total_referrals||0}/>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}