import { useState, useEffect, useRef } from 'react'
import { Search, X, Plus, Star, Loader2 } from 'lucide-react'
import api from '../lib/api'
import type { GameStatus } from '../types'
import { useGameStore } from '../stores/gameStore'

interface SteamSearchResult {
  steamAppId: number
  title: string
  coverUrl: string
  price: string
}

interface SteamGameDetails {
  steamAppId: number
  title: string
  description: string
  coverUrl: string
  price: string
  releaseDate: string
  genres: string[]
  platforms: string[]
  metacritic: number | null
  screenshots: string[]
}

interface SteamSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SteamSearchModal({ isOpen, onClose }: SteamSearchModalProps) {
  const { addGame } = useGameStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SteamSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedGame, setSelectedGame] = useState<SteamGameDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [adding, setAdding] = useState(false)
  const [status, setStatus] = useState<GameStatus>('backlog')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelectedGame(null)
      setError('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get(`/games/search?q=${encodeURIComponent(q)}`)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const selectGame = async (steamAppId: number) => {
    setLoadingDetails(true)
    setError('')
    try {
      const { data } = await api.get(`/games/search?appid=${steamAppId}`)
      setSelectedGame(data)
    } catch {
      setError('Impossible de charger les détails')
    } finally {
      setLoadingDetails(false)
    }
  }

  const addToBacklog = async () => {
    if (!selectedGame) return
    setAdding(true)
    setError('')
    try {
      await addGame({
        title: selectedGame.title,
        platform: selectedGame.platforms[0] || 'PC',
        status,
        priority: 3,
        genre: selectedGame.genres[0],
        coverUrl: selectedGame.coverUrl,
        notes: selectedGame.description,
      })
      onClose()
    } catch {
      setError('Erreur lors de l\'ajout')
    } finally {
      setAdding(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gamer-800 border border-gamer-600 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gamer-600">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-gamer-300" />
            Rechercher sur Steam
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-gamer-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selectedGame ? (
          <>
            <div className="p-4 border-b border-gamer-600">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); search(e.target.value) }}
                  placeholder="Rechercher un jeu (ex: Elden Ring, Zelda...)"
                  className="w-full pl-10 pr-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gamer-300 animate-spin" />}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {results.length === 0 && query.length >= 2 && !searching && (
                <p className="text-center text-slate-500 py-8">Aucun résultat</p>
              )}
              {results.map((game) => (
                <button
                  key={game.steamAppId}
                  onClick={() => selectGame(game.steamAppId)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gamer-600 transition-colors text-left"
                >
                  <img src={game.coverUrl} alt={game.title} className="w-20 h-10 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{game.title}</p>
                  </div>
                  <span className="text-sm text-neon-cyan font-semibold whitespace-nowrap">{game.price}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gamer-400 animate-spin" />
              </div>
            ) : (
              <>
                <div className="relative">
                  <img src={selectedGame.coverUrl} alt={selectedGame.title} className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gamer-800 via-transparent to-transparent" />
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="absolute top-3 left-3 px-3 py-1.5 bg-gamer-800/80 backdrop-blur rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    ← Retour
                  </button>
                </div>

                <div className="p-5 space-y-4 -mt-8 relative">
                  <h3 className="text-2xl font-bold text-white">{selectedGame.title}</h3>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm px-3 py-1 rounded-full bg-neon-cyan/20 text-neon-cyan font-semibold">
                      {selectedGame.price}
                    </span>
                    {selectedGame.metacritic && (
                      <span className="text-sm px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400" />
                        Metacritic: {selectedGame.metacritic}
                      </span>
                    )}
                    {selectedGame.releaseDate && (
                      <span className="text-sm px-3 py-1 rounded-full bg-gamer-500/50 text-slate-300">
                        {selectedGame.releaseDate}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedGame.genres.map((g) => (
                      <span key={g} className="text-xs px-2 py-1 rounded bg-gamer-600 text-slate-300">{g}</span>
                    ))}
                    {selectedGame.platforms.map((p) => (
                      <span key={p} className="text-xs px-2 py-1 rounded bg-gamer-500/50 text-gamer-200">{p}</span>
                    ))}
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed">{selectedGame.description}</p>

                  {selectedGame.screenshots.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedGame.screenshots.map((url, i) => (
                        <img key={i} src={url} alt="" className="rounded-lg w-full h-24 object-cover" />
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Ajouter avec le statut :</label>
                    <div className="flex flex-wrap gap-2">
                      {(['wishlist', 'backlog', 'playing'] as GameStatus[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            status === s
                              ? 'bg-gamer-400 text-white shadow-lg shadow-gamer-400/25'
                              : 'bg-gamer-600 text-slate-300 hover:brightness-125'
                          }`}
                        >
                          {s === 'wishlist' ? 'Wishlist' : s === 'backlog' ? 'Backlog' : 'En cours'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={addToBacklog}
                    disabled={adding}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gamer-400 hover:bg-gamer-300 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-gamer-400/25"
                  >
                    <Plus className="w-4 h-4" />
                    {adding ? 'Ajout en cours...' : 'Ajouter à ma collection'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
