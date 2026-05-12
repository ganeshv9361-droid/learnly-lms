import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      api.get('/users/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const params = new URLSearchParams()

    params.append('username', email)
    params.append('password', password)

    const res = await api.post('/users/login', params)

    localStorage.setItem('token', res.data.access_token)

    const me = await api.get('/users/me')

    setUser(me.data)

    return me.data
  }

  // Optional future Firebase login support
  const loginWithFirebase = async (
    firebaseToken,
    role = 'student',
    referral_code = ''
  ) => {
    const res = await api.post('/users/firebase-login', {
      firebase_token: firebaseToken,
      role,
      referral_code: referral_code || undefined
    })

    localStorage.setItem('token', res.data.access_token)

    const me = await api.get('/users/me')

    setUser(me.data)

    return me.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithFirebase,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)