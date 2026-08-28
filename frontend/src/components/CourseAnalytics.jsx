import { useState, useEffect } from 'react'
import api from '../api/axios'
import AnimatedCounter from './AnimatedCounter'

export default function CourseAnalytics({ courseId, courseName }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!courseId) return
    api.get(`/analytics/course/${courseId}`).then(r => setData(r.data)).catch(()=>{})
  }, [courseId])

  if (!data) return <div className="text-gray-500 text-sm text-center py-8">Loading analytics...</div>

  return (
    <div className="animate-fade-up space-y-4">
      <div className="text-sm font-semibold text-white">{courseName} — Analytics</div>

      {/* Overview stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
        {[
          {label:'Total Students',value:data.total_students,color:'#8b5cf6',icon:'👥'},
          {label:'Avg Progress',value:data.avg_progress,color:'#34d399',icon:'📈',suffix:'%'},
          {label:'Avg Rating',value:data.avg_rating,color:'#fbbf24',icon:'⭐'},
          {label:'Total Ratings',value:data.total_ratings,color:'#60a5fa',icon:'💬'},
        ].map(s => (
          <div key={s.label} className="stat-card rounded-xl p-4 text-center">
            <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:22,fontWeight:700,color:s.color}}>
              <AnimatedCounter value={s.value} suffix={s.suffix||''}/>
            </div>
            <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Video watch rates */}
      {data.video_stats.length > 0 && (
        <div className="card-base p-4">
          <div className="text-sm font-semibold text-white mb-3">🎬 Video Watch Rates</div>
          <div className="space-y-3">
            {data.video_stats.map(v => (
              <div key={v.video_id}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="truncate flex-1 mr-2">{v.title}</span>
                  <span className="shrink-0">{v.total_watches} views · {v.completion_rate}%</span>
                </div>
                <div style={{height:6,background:'rgba(255,255,255,0.07)',borderRadius:10,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${v.completion_rate}%`,background:'linear-gradient(90deg,#7c3aed,#06b6d4)',borderRadius:10,transition:'width 1s'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz stats */}
      {data.quiz_stats.length > 0 && (
        <div className="card-base p-4">
          <div className="text-sm font-semibold text-white mb-3">🧪 Quiz Performance</div>
          <div className="space-y-3">
            {data.quiz_stats.map(q => (
              <div key={q.quiz_id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{q.title}</div>
                  <div className="text-xs text-gray-500">{q.attempts} attempts</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold" style={{color: q.avg_score >= 50 ? '#34d399' : '#f87171'}}>
                    {q.avg_score}%
                  </div>
                  <div className="text-xs text-gray-500">{q.pass_rate}% pass</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignment stats */}
      {data.assignment_stats.length > 0 && (
        <div className="card-base p-4">
          <div className="text-sm font-semibold text-white mb-3">📝 Assignment Submissions</div>
          <div className="space-y-3">
            {data.assignment_stats.map(a => (
              <div key={a.assignment_id}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="truncate flex-1 mr-2">{a.title}</span>
                  <span className="shrink-0">{a.submissions} submitted · {a.graded} graded</span>
                </div>
                <div style={{height:6,background:'rgba(255,255,255,0.07)',borderRadius:10,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${a.submission_rate}%`,background:'linear-gradient(90deg,#f59e0b,#d97706)',borderRadius:10}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
