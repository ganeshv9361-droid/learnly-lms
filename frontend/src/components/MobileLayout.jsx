import { useState, useEffect } from 'react'

export default function MobileLayout({ sidebar, children, topbarTitle, topbarSub }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen flex" style={{background:'#0a0a0f'}}>
      {isMobile && (
        <div
          className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`${isMobile ? 'mobile-sidebar' : 'w-60'} ${isMobile && sidebarOpen ? 'open' : ''} border-r border-white/5 flex flex-col shrink-0`}
        style={{background:'rgba(10,10,15,0.98)', backdropFilter:'blur(20px)'}}>
        {sidebar({ closeSidebar: () => setSidebarOpen(false) })}
      </div>

      <div className="flex-1 overflow-y-auto mobile-main">
        <div className="sticky top-0 z-20 px-4 py-3 border-b border-white/5 flex items-center gap-3"
          style={{background:'rgba(10,10,15,0.9)', backdropFilter:'blur(20px)'}}>
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition shrink-0">
            ☰
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm truncate">{topbarTitle}</div>
            {topbarSub && <div className="text-xs text-gray-500 truncate">{topbarSub}</div>}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
