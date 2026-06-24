import { create } from 'zustand'
import api from '../lib/api'
import type { Game, GameStatus } from '../types'

interface GameState {
  games: Game[]
  loading: boolean
  error: string | null
  filterStatus: GameStatus | 'all'
  searchQuery: string
  setFilterStatus: (status: GameStatus | 'all') => void
  setSearchQuery: (query: string) => void
  fetchGames: () => Promise<void>
  addGame: (game: Omit<Game, 'id' | 'userId' | 'tenantId' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateGame: (id: string, data: Partial<Game>) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  filteredGames: () => Game[]
}

export const useGameStore = create<GameState>((set, get) => ({
  games: [],
  loading: false,
  error: null,
  filterStatus: 'all',
  searchQuery: '',

  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchGames: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get('/games')
      set({ games: data, loading: false })
    } catch {
      set({ error: 'Erreur lors du chargement', loading: false })
    }
  },

  addGame: async (game) => {
    const { data } = await api.post('/games', game)
    set((state) => ({ games: [data, ...state.games] }))
  },

  updateGame: async (id, updates) => {
    const { data } = await api.patch(`/games/${id}`, updates)
    set((state) => ({
      games: state.games.map((g) => (g.id === id ? data : g)),
    }))
  },

  deleteGame: async (id) => {
    await api.delete(`/games/${id}`)
    set((state) => ({
      games: state.games.filter((g) => g.id !== id),
    }))
  },

  filteredGames: () => {
    const { games, filterStatus, searchQuery } = get()
    return games.filter((game) => {
      const matchStatus = filterStatus === 'all' || game.status === filterStatus
      const matchSearch = !searchQuery || game.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchStatus && matchSearch
    })
  },
}))
