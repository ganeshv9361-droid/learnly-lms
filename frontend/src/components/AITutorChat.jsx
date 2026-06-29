import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

export default function AITutorChat({ compact = false }) {
  const [mode, setMode] = useState('chat')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const scrollRef = useRef()

  const [quizTopic, setQuizTopic] = useState('')
  const [quizCount, setQuizCount] = useState(5)
  const [quiz, setQuiz] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)

  useEffect(() => {
    api.get('/ai-tutor/messages').then(r => setMessages(r.data)).finally(() => setLoadingHistory(false))
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const text = input
    setInput('')
    setMessages(m => [...m, { role: 'user', content: text, id: 'temp-' + Date.now() }])
    setLoading(true)
    try {
      const r = await api.post('/ai-tutor/chat', { message: text })
      setMessages(m => [...m, { role: 'assistant', content: r.data.reply, id: 'temp-r-' + Date.now() }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ ' + (err.response?.data?.detail || 'Something went wrong. Try again.'), id: 'err-' + Date.now() }])
    }
    setLoading(false)
  }

  const clearChat = async () => {
    if (!confirm('Clear all chat history?')) return
    await api.delete('/ai-tutor/messages')
    setMessages([])
  }

  const generateQuiz = async (e) => {
    e.preventDefault()
    if (!quizTopic.trim()) return
    setQuizLoading(true)
    setQuiz(null)
    setQuizAnswers({})
    setQuizSubmitted(false)
    try {
      const r = await api.post('/ai-tutor/quiz', { topic: quizTopic, num_questions: quizCount })
      setQuiz(r.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate quiz. Try a different topic.')
    }
    setQuizLoading(false)
  }

  const score = quiz ? quiz.questions.filter((q, i) => quizAnswers[i] === q.correct).length : 0

  return (
    <div className="flex flex-col h-full">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-3 shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {[['chat', '💬 Ask AI'], ['quiz', '🧪 Practice Quiz']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${mode === m ? 'btn-primary text-white' : 'text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* CHAT MODE */}
      {mode === 'chat' && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
            {loadingHistory && (
              <div className="text-center text-xs py-6" style={{ color: 'var(--text3)' }}>Loading conversation...</div>
            )}
            {!loadingHistory && messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-sm font-medium text-white mb-1">Hi! I'm your AI tutor</div>
                <div className="text-xs" style={{ color: 'var(--text3)' }}>Ask me anything about your courses — I'll explain it simply.</div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'btn-primary text-white' : 'glass text-white'}`}
                  style={m.role !== 'user' ? { border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass rounded-2xl px-4 py-3 flex gap-1.5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a78bfa', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex gap-2 pt-2 shrink-0">
            <input value={input} onChange={e => setInput(e.target.value)}
              className="input-base flex-1" placeholder="Ask about any topic..."
              disabled={loading} />
            <button type="submit" disabled={loading || !input.trim()}
              className="btn-primary text-white px-4 rounded-2xl text-sm font-semibold disabled:opacity-40 shrink-0">
              ➤
            </button>
          </form>
          {messages.length > 0 && (
            <button onClick={clearChat} className="text-xs mt-2 text-center w-full" style={{ color: 'var(--text3)' }}>
              Clear conversation
            </button>
          )}
        </>
      )}

      {/* QUIZ MODE */}
      {mode === 'quiz' && (
        <div className="flex-1 overflow-y-auto px-1">
          {!quiz && (
            <form onSubmit={generateQuiz} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Topic</label>
                <input value={quizTopic} onChange={e => setQuizTopic(e.target.value)}
                  className="input-base" placeholder="e.g. OFDM modulation, Newton's laws..." />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Number of questions</label>
                <div className="flex gap-2">
                  {[3, 5, 10].map(n => (
                    <button key={n} type="button" onClick={() => setQuizCount(n)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${quizCount === n ? 'btn-primary text-white' : 'btn-ghost text-white/60'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={quizLoading || !quizTopic.trim()}
                className="btn-primary w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50">
                {quizLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating quiz...
                  </span>
                ) : '✨ Generate Practice Quiz'}
              </button>
            </form>
          )}

          {quiz && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white text-sm">{quiz.topic}</div>
                <button onClick={() => setQuiz(null)} className="text-xs" style={{ color: 'var(--text3)' }}>← New quiz</button>
              </div>

              {quizSubmitted && (
                <div className="card-base p-4 text-center">
                  <div className={`text-3xl font-bold mb-1 ${score >= quiz.questions.length / 2 ? 'text-green-400' : 'text-amber-400'}`}>
                    {score}/{quiz.questions.length}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text3)' }}>
                    {score === quiz.questions.length ? '🎉 Perfect score!' : score >= quiz.questions.length / 2 ? 'Good job! Review what you missed below.' : 'Keep practicing — check the explanations below.'}
                  </div>
                </div>
              )}

              {quiz.questions.map((q, i) => (
                <div key={i} className="card-base p-4">
                  <div className="text-sm text-white font-medium mb-3">{i + 1}. {q.question}</div>
                  <div className="space-y-2">
                    {['A', 'B', 'C', 'D'].map(opt => {
                      const isSelected = quizAnswers[i] === opt
                      const isCorrect = q.correct === opt
                      let style = { border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }
                      if (quizSubmitted) {
                        if (isCorrect) style = { border: '1px solid rgba(52,211,153,0.5)', background: 'rgba(52,211,153,0.12)' }
                        else if (isSelected) style = { border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.1)' }
                      } else if (isSelected) {
                        style = { border: '1px solid rgba(124,58,237,0.6)', background: 'rgba(124,58,237,0.15)' }
                      }
                      return (
                        <button key={opt} type="button" disabled={quizSubmitted}
                          onClick={() => setQuizAnswers(a => ({ ...a, [i]: opt }))}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-200 transition" style={style}>
                          <span className="font-bold mr-2" style={{ color: '#a78bfa' }}>{opt}.</span>
                          {q[`option_${opt.toLowerCase()}`]}
                        </button>
                      )
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className="text-xs mt-3 p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--text2)' }}>
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              ))}

              {!quizSubmitted ? (
                <button onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(quizAnswers).length < quiz.questions.length}
                  className="btn-primary w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-40">
                  Submit ({Object.keys(quizAnswers).length}/{quiz.questions.length})
                </button>
              ) : (
                <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false) }}
                  className="btn-ghost w-full text-white py-3 rounded-2xl font-semibold text-sm">
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
