import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'
import type { AuthUser } from '../types'

interface LoginResponse {
  access: string
  refresh: string
}

function decodeJWT(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      user_id:    payload.user_id,
      email:      payload.email,
      full_name:  payload.full_name,
      role:       payload.role,
      department: payload.department ?? '',
    }
  } catch {
    return null
  }
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: (() => {
        const token = localStorage.getItem('access_token')
        return token ? decodeJWT(token) : null
      })(),
      isAuthenticated: !!localStorage.getItem('access_token'),

      login: async (email, password) => {
        const { data } = await api.post<LoginResponse>('/auth/login/', { email, password })
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        const user = decodeJWT(data.access)
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
      },
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
)
