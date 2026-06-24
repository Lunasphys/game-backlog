import { useState, useEffect } from 'react'
import { X, Download, Check, Settings, Clock, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import type { SteamLibraryGame } from '../types'

interface SteamImportModalProps {
  isOpen: boolean
  onClose: () => void
}

function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  return `${Math.round(minutes / 60)}h`
}

export default function SteamImportModal({ isOpen, onClose }: SteamImportModalProps) {
  const { user, updateSteamId } = useAuthStore()
  const [steamId, setSteamId] = useState('')
  const [library, setLibrary] = useState<SteamLibraryGame[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ imported: number; updated: number } | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSteamId(user?.steamId || '')
      setLibrary([])
      setSelected(new Set())
      setError('')
      setResult(null)
      setShowSettings(!user?.steamId)
    }
  }, [isOpen, user?.steamId])

  const saveSteamId = async () => {
    if (!/^\d{17}$/.test(steamId)) {
      setError('Le Steam ID doit contenir 17 chiffres')
      return
    }
    setError('')
    try {
      await updateSteamId(steamId)
      setShowSettings(false)
      await loadLibrary()
    } catch {
      setError('Erreur lors de la sauvegarde')
    }
  }

  const loadLibrary = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/steam/library')
      setLibrary(data.games)
      setSelected(new Set(data.games.map((g: SteamLibraryGame) => g.steamAppId)))
    } catch {
      setError('Impossible de charger ta bibliothèque Steam. Vérifie que ton profil est public.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && user?.steamId) {
      loadLibrary()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.steamId])

  const toggleGame = (appId: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(appId)) next.delete(appId)
      else next.add(appId)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === library.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(library.map((g) => g.steamAppId)))
    }
  }

  const importGames = async () => {
    if (selected.size === 0) return
    setImporting(true)
    setError('')
    try {
      const { data } = await api.post('/steam/import', { steamAppIds: [...selected] })
      setResult(data)
    } catch {
      setError("Erreur lors de l'import")
    } finally {
      setImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gamer-800 border border-gamer-600 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gamer-600">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-neon-cyan" />
            Importer depuis Steam
          </h2>
          <div className="flex items-center gap-2">
            {user?.steamId && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-gamer-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-gamer-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {result ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-4 bg-green-500/20 rounded-2xl mb-4">
              <Check className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Import terminé !</h3>
            <p className="text-slate-400">
              {result.imported} jeu{result.imported > 1 ? 'x' : ''} importé{result.imported > 1 ? 's' : ''}
              {result.updated > 0 && `, ${result.updated} mis à jour`}
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-gamer-400 hover:bg-gamer-300 text-white font-medium rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : showSettings || !user?.steamId ? (
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-400">
              Entre ton Steam ID 64-bit pour importer ta bibliothèque.
              Tu le trouves sur{' '}
              <a href="https://steamid.io" target="_blank" rel="noopener noreferrer" className="text-gamer-300 hover:underline">
                steamid.io
              </a>{' '}
              (champ "steamID64").
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="76561198XXXXXXXXX"
                maxLength={17}
                className="flex-1 px-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors font-mono"
              />
              <button
                onClick={saveSteamId}
                className="px-5 py-2.5 bg-gamer-400 hover:bg-gamer-300 text-white font-medium rounded-lg transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-gamer-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-400">Chargement de ta bibliothèque Steam...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gamer-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAll}
                  className="text-sm text-gamer-300 hover:text-gamer-200 transition-colors"
                >
                  {selected.size === library.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <span className="text-sm text-slate-500">{selected.size}/{library.length} sélectionnés</span>
              </div>
              <button
                onClick={importGames}
                disabled={importing || selected.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gamer-400 hover:bg-gamer-300 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Importer ({selected.size})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {library.map((game) => (
                <button
                  key={game.steamAppId}
                  onClick={() => toggleGame(game.steamAppId)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left ${
                    selected.has(game.steamAppId) ? 'bg-gamer-400/10 border border-gamer-400/30' : 'hover:bg-gamer-600 border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected.has(game.steamAppId) ? 'bg-gamer-400 border-gamer-400' : 'border-gamer-500'
                  }`}>
                    {selected.has(game.steamAppId) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <img src={game.coverUrl} alt={game.title} className="w-24 h-11 object-cover rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{game.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatPlaytime(game.playtimeMinutes)}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
