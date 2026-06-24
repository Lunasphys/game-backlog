import { X, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Game, GameStatus } from '../types'
import { STATUS_CONFIG, PLATFORMS, GENRES } from '../types'
import { useGameStore } from '../stores/gameStore'

interface GameModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  title: string
  platform: string
  status: GameStatus
  priority: number
  genre: string
  coverUrl: string
  notes: string
  rating: string
}

const emptyForm: FormData = {
  title: '',
  platform: 'PC',
  status: 'backlog',
  priority: 3,
  genre: '',
  coverUrl: '',
  notes: '',
  rating: '',
}

export default function GameModal({ game, isOpen, onClose }: GameModalProps) {
  const { addGame, updateGame } = useGameStore()
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (game) {
      setForm({
        title: game.title,
        platform: game.platform,
        status: game.status,
        priority: game.priority,
        genre: game.genre || '',
        coverUrl: game.coverUrl || '',
        notes: game.notes || '',
        rating: game.rating?.toString() || '',
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  }, [game, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Le titre est obligatoire')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title.trim(),
        platform: form.platform,
        status: form.status,
        priority: form.priority,
        genre: form.genre || undefined,
        coverUrl: form.coverUrl || undefined,
        notes: form.notes || undefined,
        rating: form.rating ? parseInt(form.rating) : undefined,
      }
      if (game) {
        await updateGame(game.id, payload)
      } else {
        await addGame(payload)
      }
      onClose()
    } catch {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gamer-800 border border-gamer-600 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gamer-600">
          <h2 className="text-lg font-bold text-white">
            {game ? 'Modifier le jeu' : 'Ajouter un jeu'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-gamer-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Titre *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors"
              placeholder="The Legend of Zelda..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Plateforme</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Genre</label>
              <select
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className="w-full px-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors"
              >
                <option value="">— Aucun —</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Statut</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(STATUS_CONFIG) as [GameStatus, { label: string; color: string; bg: string }][]).map(([key, conf]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, status: key })}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${form.status === key
                    ? 'bg-gamer-400 text-white shadow-lg shadow-gamer-400/25'
                    : `${conf.bg} ${conf.color} hover:brightness-125`
                  }`}
                >
                  {conf.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Priorité : {form.priority}/5
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
              className="w-full accent-gamer-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Note personnelle (1-10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              className="w-full px-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors"
              placeholder="Optionnel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">URL de la cover</label>
            <input
              type="url"
              value={form.coverUrl}
              onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
              className="w-full px-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors resize-none"
              placeholder="Mes impressions..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gamer-400 hover:bg-gamer-300 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-gamer-400/25"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : game ? 'Modifier' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  )
}
