import { useState } from 'react'
import AITutorChat from './AITutorChat'

export default function AIChatBubble() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-start sm:p-6 p-0"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="card-base w-full h-full sm:w-96 sm:h-[600px] sm:rounded-3xl flex flex-col p-4"
            style={{ background: '#0d0d1a', border: '1px solid rgba(124,58,237,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl btn-primary flex items-center justify-center text-sm">🤖</div>
                <div>
                  <div className="text-sm font-semibold text-white">AI Tutor</div>
                  <div className="text-xs" style={{ color: 'var(--text3)' }}>Powered by Gemini</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AITutorChat compact />
            </div>
          </div>
        </div>
      )}

     {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-24 left-4 sm:bottom-6 sm:left-6 z-[150] w-14 h-14 rounded-full btn-primary flex items-center justify-center text-2xl animate-pulse-glow"
          style={{ boxShadow: '0 8px 30px rgba(124,58,237,0.5)' }}>
          🤖
        </button>
      )}
    </>
  )
}
