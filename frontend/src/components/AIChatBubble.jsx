import { useState } from 'react'
import AITutorChat from './AITutorChat'

export default function AIChatBubble() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <>
          {/* Dark overlay — closes on click */}
          <div
            className="fixed inset-0 z-[190]"
            style={{background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)'}}
            onClick={() => setOpen(false)}
          />

          {/* Chat panel — bottom-left on desktop, full screen on mobile */}
          <div
            className="fixed z-[200] flex flex-col"
            style={{
              right: '16px',
              bottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 60px)',
              width: 'min(420px, calc(100vw - 32px))',
              height: 'min(580px, calc(100vh - 120px))',
              background: '#0d0d1a',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)',
              padding: '16px',
              overflow: 'hidden'
            }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-3 shrink-0"
              style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl btn-primary flex items-center justify-center text-base shrink-0">
                  🤖
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">AI Tutor</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                    <span className="text-xs" style={{color:'var(--text3)'}}>Powered by Gemini</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition shrink-0">
                ✕
              </button>
            </div>

            {/* Chat content */}
            <div className="flex-1 min-h-0">
              <AITutorChat />
            </div>
          </div>
        </>
      )}

      {/* Floating button — bottom left, above mobile nav */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed z-[150] btn-primary flex items-center gap-2 text-white font-medium text-sm"
        style={{
          right: '16px',
          bottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 12px)',
          padding: '10px 16px',
          borderRadius: '50px',
          boxShadow: '0 8px 30px rgba(124,58,237,0.5)',
          transition: 'all 0.3s ease'
        }}>
        <span style={{fontSize:20}}>🤖</span>
        <span className="hidden sm:inline">Ask AI</span>
      </button>
    </>
  )
}