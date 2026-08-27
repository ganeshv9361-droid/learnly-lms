import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function NotesPanel({ courseId, videoId, currentTime }) {
  const [notes, setNotes] = useState([])
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!courseId) return
    api.get(`/notes/course/${courseId}`).then(r => setNotes(r.data))
  }, [courseId])

  const save = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await api.post('/notes/', {
        course_id: courseId,
        video_id: videoId || null,
        content,
        timestamp: currentTime || null
      })
      const r = await api.get(`/notes/course/${courseId}`)
      setNotes(r.data)
      setContent('')
    } catch(e) {}
    setSaving(false)
  }

  const deleteNote = async (id) => {
    await api.delete(`/notes/${id}`)
    setNotes(n => n.filter(x => x.id !== id))
  }

  const exportNotes = () => {
    const text = notes.map(n =>
      `[${new Date(n.created_at).toLocaleDateString()}]${n.timestamp ? ` @${Math.floor(n.timestamp/60)}:${String(Math.floor(n.timestamp%60)).padStart(2,'0')}` : ''}\n${n.content}`
    ).join('\n\n---\n\n')
    const blob = new Blob([text], {type:'text/plain'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'learnly-notes.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="text-sm font-semibold text-white">📝 My Notes</div>
        {notes.length > 0 && (
          <button onClick={exportNotes}
            style={{fontSize:11,color:'#a78bfa',background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.2)',padding:'4px 10px',borderRadius:8,cursor:'pointer'}}>
            ⬇ Export
          </button>
        )}
      </div>
      <div className="flex gap-2 mb-3 shrink-0">
        <textarea value={content} onChange={e => setContent(e.target.value)}
          className="input-base flex-1 resize-none" rows={3}
          placeholder="Write a note about this video..."/>
      </div>
      <button onClick={save} disabled={saving || !content.trim()}
        className="btn-primary text-white py-2 rounded-xl text-sm mb-3 shrink-0 disabled:opacity-40">
        {saving ? 'Saving...' : 'Save Note'}
      </button>
      <div className="flex-1 overflow-y-auto space-y-2">
        {notes.length === 0 && (
          <div className="text-center py-6 text-gray-600 text-sm">No notes yet</div>
        )}
        {notes.map(n => (
          <div key={n.id} className="glass rounded-xl p-3 border border-white/5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {n.timestamp && (
                  <div className="text-xs mb-1" style={{color:'#a78bfa'}}>
                    ⏱ {Math.floor(n.timestamp/60)}:{String(Math.floor(n.timestamp%60)).padStart(2,'0')}
                  </div>
                )}
                <div className="text-sm text-gray-200 leading-relaxed">{n.content}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(n.created_at).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => deleteNote(n.id)}
                className="text-red-400 hover:text-red-300 text-xs shrink-0">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
