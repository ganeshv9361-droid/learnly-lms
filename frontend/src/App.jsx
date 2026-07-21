import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import DeveloperDashboard from './pages/DeveloperDashboard'
import AIChatBubble from './components/AIChatBubble'


function NetworkCheck({ children }) {
  const [online, setOnline] = useState(true)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = () => setOnline(navigator.onLine)
    check()
    setChecking(false)
    window.addEventListener('online', check)
    window.addEventListener('offline', check)
    return () => {
      window.removeEventListener('online', check)
      window.removeEventListener('offline', check)
    }
  }, [])

  if (checking) return null

  if (!online) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{background:'#080810'}}>
      <div className="text-center animate-fade-up">
        <div className="text-6xl mb-4">📡</div>
        <div className="font-display text-2xl font-bold text-white mb-2">No Internet</div>
        <div className="text-sm mb-6" style={{color:'var(--text3)'}}>
          Please check your connection and try again
        </div>
        <button onClick={() => window.location.reload()}
          className="btn-primary text-white px-6 py-3 rounded-2xl font-semibold text-sm">
          Retry
        </button>
      </div>
    </div>
  )

  return children
}

function AppInner() {
  const { user, loading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)
  return (
    <NetworkCheck>
      {/* existing return content */}
    </NetworkCheck>
  )


 if (loading) return (
  <div className="min-h-screen flex items-center justify-center" style={{background:'#0a0a0f'}}>
    <div className="text-center animate-fade-up">
      
      <div className="w-20 h-20 mx-auto mb-4 animate-pulse-glow">
        <img 
          src="/logo.png"   // OR import if inside src
          alt="Learnly Logo"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  </div>
)

  if (!user) return showRegister
    ? <Register onSwitch={() => setShowRegister(false)} />
    : <Login onSwitch={() => setShowRegister(true)} />

  if (user.role === 'student') return (<><StudentDashboard /><AIChatBubble /></>)
  if (user.role === 'teacher') return <TeacherDashboard />
  if (user.role === 'developer') return <DeveloperDashboard />

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#0a0a0f'}}>
      <div className="text-white text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-lg font-semibold mb-2">Unknown role</div>
        <div className="text-gray-400 text-sm">{user.role}</div>
      </div>
    </div>
  )
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}