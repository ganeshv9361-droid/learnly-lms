import { useState, useEffect } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import Logo from './Logo'

export default function MobileLayout({
  sidebar,
  children,
  topbarTitle,
  topbarSub,
  bottomNavItems,
  activeTab,
  onTabChange,
  msgBar,
  logout
}) {
  const { isMobile, isDesktop } = useBreakpoint()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    document.body.style.overflow =
      (isMobile && sidebarOpen) ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobile, sidebarOpen])

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false)
  }, [isMobile])

  const sidebarWidth =
    sidebarCollapsed && isDesktop ? '72px' : '240px'

  return (
    <div
      className="min-h-screen flex w-full"
      style={{ background: 'var(--bg)' }}
    >

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-[190]"
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: isMobile ? '260px' : sidebarWidth,
          minWidth: isMobile ? '260px' : sidebarWidth,
          background: 'rgba(8,8,16,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(30px)',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',

          ...(isMobile
            ? {
                position: 'fixed',
                top: 0,
                left: sidebarOpen ? '0' : '-280px',
                bottom: 0,
                zIndex: 200,
                boxShadow: sidebarOpen
                  ? '8px 0 40px rgba(0,0,0,0.6)'
                  : 'none',
                display: 'flex',
                flexDirection: 'column'
              }
            : {
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflowY: 'auto',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column'
              })
        }}
      >

        {/* Sidebar content */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {sidebar({
            closeSidebar: () => setSidebarOpen(false),
            collapsed: sidebarCollapsed && isDesktop,
            toggleCollapse: () => setSidebarCollapsed(c => !c)
          })}
        </div>

        {/* Logout button */}
        {logout && (
          <div
            style={{
              padding: '10px 12px 14px',
              flexShrink: 0
            }}
          >
            <button
              onClick={logout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  sidebarCollapsed && isDesktop
                    ? 'center'
                    : 'flex-start',
                gap: 8,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                marginTop: 4,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'rgba(239,68,68,0.18)'
                e.currentTarget.style.borderColor =
                  'rgba(239,68,68,0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  'rgba(239,68,68,0.1)'
                e.currentTarget.style.borderColor =
                  'rgba(239,68,68,0.2)'
              }}
              title={
                sidebarCollapsed && isDesktop
                  ? 'Sign out'
                  : ''
              }
            >
              <span
                style={{
                  fontSize: 16,
                  lineHeight: 1
                }}
              >
                ⏻
              </span>

              {!(sidebarCollapsed && isDesktop) && (
                <span>Sign out</span>
              )}
            </button>
          </div>
        )}

      </aside>

      {/* Main content */}
      <main
        className="flex-1 flex flex-col overflow-hidden"
        style={{ minWidth: 0 }}
      >

        {/* Topbar */}
        <header
          className="sticky top-0 z-[50] flex items-center gap-3 px-4 sm:px-6"
          style={{
            height: '56px',
            background: 'rgba(8,8,16,0.92)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0
          }}
        >

          {/* Mobile menu toggle */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(s => !s)}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#9ba3c8'
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M2 4h14M2 9h14M2 14h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          {/* Desktop collapse toggle */}
          {isDesktop && (
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition"
              style={{
                color: 'var(--text3)',
                background: 'transparent'
              }}
              title={
                sidebarCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d={
                    sidebarCollapsed
                      ? 'M6 3l5 5-5 5'
                      : 'M10 3L5 8l5 5'
                  }
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm truncate">
              {topbarTitle}
            </div>

            {topbarSub && (
              <div
                className="text-xs truncate hidden sm:block"
                style={{ color: 'var(--text3)' }}
              >
                {topbarSub}
              </div>
            )}
          </div>

          {msgBar && (
            <div className="shrink-0 hidden sm:block">
              {msgBar}
            </div>
          )}

        </header>

        {/* Page content */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            paddingBottom:
              isMobile && bottomNavItems
                ? '72px'
                : '0'
          }}
        >
          {children}
        </div>

      </main>

      {/* Bottom nav — mobile only */}
      {bottomNavItems && isMobile && (
        <nav
          className="fixed left-0 right-0 z-[100] flex"
          style={{
            bottom: 0,
            background: 'rgba(8,8,16,0.97)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingBottom: 'env(safe-area-inset-bottom, 8px)',
            paddingTop: '8px',
            height: '60px'
          }}
        >
          {bottomNavItems
            .slice(0, 5)
            .map(([key, icon, label]) => (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative"
                style={{
                  color:
                    activeTab === key
                      ? '#a78bfa'
                      : '#4a5280'
                }}
              >
                {activeTab === key && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                      width: '32px',
                      height: '2px',
                      background:
                        'linear-gradient(90deg,#7c3aed,#06b6d4)'
                    }}
                  />
                )}

                <span
                  style={{
                    fontSize: 18,
                    lineHeight: 1
                  }}
                >
                  {icon}
                </span>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight:
                      activeTab === key ? 600 : 400,
                    lineHeight: 1
                  }}
                >
                  {label}
                </span>
              </button>
            ))}
        </nav>
      )}

    </div>
  )
}