import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

function getYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

export default function CoursePlayer({ course, onBack }) {
  const [videos, setVideos] = useState([])
  const [active, setActive] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addTab, setAddTab] = useState('youtube')
  const [ytForm, setYtForm] = useState({ title:'', youtube_url:'' })
  const [uploadForm, setUploadForm] = useState({ title:'', file:null })
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const loadVideos = () => {
    api.get(`/videos/course/${course.course_id}`).then(r => {
      setVideos(r.data)
      if (r.data.length > 0 && !active) setActive(r.data[0])
    })
  }

  useEffect(() => { loadVideos() }, [])

  const addYoutube = async (e) => {
    e.preventDefault()
    try {
      await api.post('/videos/youtube', {
        course_id: course.course_id,
        title: ytForm.title,
        youtube_url: ytForm.youtube_url,
        order: videos.length
      })
      setYtForm({ title:'', youtube_url:'' })
      loadVideos()
      flash('YouTube video added!')
    } catch { flash('Failed to add video') }
  }

  const uploadVideo = async (e) => {
    e.preventDefault()
    if (!uploadForm.file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('course_id', course.course_id)
    fd.append('title', uploadForm.title)
    fd.append('order', videos.length)
    fd.append('file', uploadForm.file)
    try {
      await api.post('/videos/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadForm({ title:'', file:null })
      if (fileRef.current) fileRef.current.value = ''
      loadVideos()
      flash('Video uploaded!')
    } catch { flash('Upload failed') }
    setUploading(false)
  }

  const deleteVideo = async (id) => {
    if (!confirm('Delete this video?')) return
    await api.delete(`/videos/${id}`)
    if (active?.id === id) setActive(null)
    loadVideos()
    flash('Video deleted')
  }

  const ic = "w-full bg-[#252c42] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
  const lc = "text-xs text-gray-400 mb-1 block"

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">

      {/* Topbar */}
      <div className="bg-[#181c27] border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <button onClick={onBack}
          className="text-gray-400 hover:text-white text-sm transition flex items-center gap-1">
          ← Back
        </button>
        <div className="font-medium text-white">{course.course_title}</div>
        <div className="text-xs text-gray-500">{videos.length} videos</div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="ml-auto bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-1.5 rounded-lg transition">
          + Add Video
        </button>
      </div>

      {/* Flash */}
      {msg && (
        <div className="mx-6 mt-3 bg-violet-500/10 border border-violet-500/30 text-violet-300 text-sm px-4 py-2 rounded-lg">
          {msg}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="mx-6 mt-4 bg-[#181c27] border border-white/10 rounded-xl p-5">
          <div className="flex gap-3 mb-4">
            {[['youtube','YouTube Link'],['upload','Upload File']].map(([t,label]) => (
              <button key={t} onClick={() => setAddTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm transition ${addTab===t?'bg-violet-600 text-white':'bg-white/5 text-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>

          {addTab === 'youtube' && (
            <form onSubmit={addYoutube} className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-40">
                <label className={lc}>Video title</label>
                <input required value={ytForm.title}
                  onChange={e => setYtForm({...ytForm, title: e.target.value})}
                  className={ic} placeholder="Intro to ML" />
              </div>
              <div className="flex-1 min-w-60">
                <label className={lc}>YouTube URL</label>
                <input required value={ytForm.youtube_url}
                  onChange={e => setYtForm({...ytForm, youtube_url: e.target.value})}
                  className={ic} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="flex items-end">
                <button type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition">
                  Add
                </button>
              </div>
            </form>
          )}

          {addTab === 'upload' && (
            <form onSubmit={uploadVideo} className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-40">
                <label className={lc}>Video title</label>
                <input required value={uploadForm.title}
                  onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                  className={ic} placeholder="Lecture 1" />
              </div>
              <div className="flex-1 min-w-60">
                <label className={lc}>Video file (mp4, webm)</label>
                <input ref={fileRef} required type="file" accept="video/*"
                  onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})}
                  className={ic} />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={uploading}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 gap-0 mt-4 px-6 pb-6">

        {/* Video player */}
        <div className="flex-1 mr-4">
          {!active ? (
            <div className="bg-[#181c27] border border-white/10 rounded-xl h-64 flex items-center justify-center">
              <div className="text-gray-500 text-sm">
                {videos.length === 0 ? 'No videos yet. Add one above.' : 'Select a video to play'}
              </div>
            </div>
          ) : (
            <div>
              {/* Player */}
              <div className="bg-black rounded-xl overflow-hidden mb-4" style={{aspectRatio:'16/9'}}>
                {active.youtube_url ? (
                  <iframe
                    key={active.id}
                    width="100%" height="100%"
                    src={`https://www.youtube.com/embed/${getYoutubeId(active.youtube_url)}?autoplay=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <video
                    key={active.id}
                    controls autoPlay
                    className="w-full h-full"
                    src={`http://localhost:8000${active.file_path}`}
                  />
                )}
              </div>

              {/* Video info */}
              <div className="bg-[#181c27] border border-white/10 rounded-xl p-4">
                <div className="font-medium text-white mb-1">{active.title}</div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  {active.youtube_url
                    ? <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded">YouTube</span>
                    : <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">Uploaded</span>
                  }
                  <span>{course.course_title}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Playlist */}
        <div className="w-72 shrink-0">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Playlist</div>
          {videos.length === 0 && (
            <div className="text-gray-600 text-sm">No videos yet.</div>
          )}
          <div className="flex flex-col gap-2">
            {videos.map((v, i) => (
              <div key={v.id}
                onClick={() => setActive(v)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition group border ${active?.id===v.id ? 'bg-violet-600/20 border-violet-500/40' : 'bg-[#181c27] border-white/10 hover:border-white/20'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium shrink-0 ${active?.id===v.id?'bg-violet-600 text-white':'bg-white/5 text-gray-400'}`}>
                  {i+1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{v.title}</div>
                  <div className="text-xs text-gray-500">
                    {v.youtube_url ? '▶ YouTube' : '▶ Uploaded'}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteVideo(v.id) }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition px-1">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
