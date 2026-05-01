import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'
import type { AuthUser } from '../types'

function decode(token: string): AuthUser | null {
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return { user_id: p.user_id, email: p.email, full_name: p.full_name, role: p.role, department: p.department }
  } catch { return null }
}

interface AuthState {
  user: AuthUser | null
  isAuth: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    set => ({
      user:   (() => { const t = localStorage.getItem('access'); return t ? decode(t) : null })(),
      isAuth: !!localStorage.getItem('access'),
      login: async (email, password) => {
        const { data } = await api.post('/auth/login/', { email, password })
        localStorage.setItem('access',  data.access)
        localStorage.setItem('refresh', data.refresh)
        set({ user: decode(data.access), isAuth: true })
      },
      logout: () => {
        localStorage.clear()
        set({ user: null, isAuth: false })
      },
    }),
    { name: 'auth', partialize: s => ({ user: s.user, isAuth: s.isAuth }) }
  )
)
