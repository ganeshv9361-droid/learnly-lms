import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function LeaderboardTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/leaderboard/').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  const medals = ['🥇','🥈','🥉']

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-gray-500">Loading leaderboard...</div>
  )

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="text-base font-semibold text-white">🏆 Leaderboard</div>
        <div className="text-xs text-gray-500">Top 50 students</div>
      </div>
      <div className="space-y-2">
        {data.map((s, i) => (
          <div key={s.id}
            className="glass rounded-xl p-3 border border-white/5 flex items-center gap-3"
            style={i < 3 ? {border:'1px solid rgba(251,191,36,0.2)',background:'rgba(251,191,36,0.05)'} : {}}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{background: i===0?'rgba(251,191,36,0.2)':i===1?'rgba(156,163,175,0.2)':i===2?'rgba(180,83,9,0.2)':'rgba(255,255,255,0.06)',
                color: i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#b45309':'#6b7280'}}>
              {i < 3 ? medals[i] : s.rank}
            </div>
            <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
              {s.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm truncate">{s.name}</div>
              <div className="text-xs text-gray-500">
                {s.certificates} certs · {s.current_streak}🔥 · {s.avg_quiz_score}% avg
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold" style={{color:'#a78bfa'}}>{s.total_score}</div>
              <div className="text-xs text-gray-600">points</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-xl text-xs text-center text-gray-500"
        style={{background:'rgba(255,255,255,0.03)'}}>
        Score = Certificates×100 + Streak×10 + Enrollments×5 + Quiz Average
      </div>
    </div>
  )
}
