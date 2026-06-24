export type GameStatus = 'wishlist' | 'backlog' | 'playing' | 'completed' | 'abandoned'

export interface Game {
  id: string
  title: string
  platform: string
  status: GameStatus
  priority: number
  genre?: string
  coverUrl?: string
  notes?: string
  rating?: number
  steamAppId?: number
  playtimeMinutes?: number
  userId: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  steamId?: string
}

export interface SteamLibraryGame {
  steamAppId: number
  title: string
  coverUrl: string
  playtimeMinutes: number
  lastPlayed: string | null
}

export interface AuthResponse {
  token: string
  user: User
}

export const STATUS_CONFIG: Record<GameStatus, { label: string; color: string; bg: string }> = {
  wishlist: { label: 'Wishlist', color: 'text-pink-400', bg: 'bg-pink-500/20' },
  backlog: { label: 'Backlog', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  playing: { label: 'En cours', color: 'text-green-400', bg: 'bg-green-500/20' },
  completed: { label: 'Terminé', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  abandoned: { label: 'Abandonné', color: 'text-gray-400', bg: 'bg-gray-500/20' },
}

export const PLATFORMS = [
  'PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One',
  'Nintendo Switch', 'Mobile', 'Steam Deck', 'Autre',
]

export const GENRES = [
  'Action', 'Aventure', 'RPG', 'FPS', 'TPS', 'Stratégie',
  'Simulation', 'Sport', 'Course', 'Horreur', 'Puzzle',
  'Plateforme', 'Combat', 'MMORPG', 'Roguelike', 'Autre',
]
