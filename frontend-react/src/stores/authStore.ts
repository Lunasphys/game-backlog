import { create } from 'zustand'
import api from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  fetchMe: () => Promise<void>
  updateSteamId: (steamId: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth', { email, password })
    localStorage.setItem('token', data.token)
    set({ token: data.token, user: data.user })
  },

  register: async (email, password) => {
    const { data } = await api.post('/auth/register', { email, password })
    localStorage.setItem('token', data.token)
    set({ token: data.token, user: data.user })
  },

  fetchMe: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, loading: false })
    }
  },

  updateSteamId: async (steamId: string) => {
    const { data } = await api.patch('/auth/me', { steamId })
    set({ user: data })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))
