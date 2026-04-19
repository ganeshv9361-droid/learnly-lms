import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import DeveloperDashboard from './pages/DeveloperDashboard'

function AppInner() {
  const { user, loading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#0a0a0f'}}>
      <div className="text-center animate-fade-up">
        <div className="w-16 h-16 rounded-2xl btn-primary flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
          <span className="font-display text-2xl text-white">✦</span>
        </div>
        <div className="text-gray-400 text-sm">Loading Learnly...</div>
      </div>
    </div>
  )

  if (!user) return showRegister
    ? <Register onSwitch={() => setShowRegister(false)} />
    : <Login onSwitch={() => setShowRegister(true)} />

  if (user.role === 'student') return <StudentDashboard />
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