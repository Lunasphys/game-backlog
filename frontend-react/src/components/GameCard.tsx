import { Star, Trash2, Edit3, ChevronDown, Clock } from 'lucide-react'
import { useState } from 'react'
import type { Game, GameStatus } from '../types'
import { STATUS_CONFIG } from '../types'
import { useGameStore } from '../stores/gameStore'

interface GameCardProps {
  game: Game
  onEdit: (game: Game) => void
}

export default function GameCard({ game, onEdit }: GameCardProps) {
  const { updateGame, deleteGame } = useGameStore()
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const statusConf = STATUS_CONFIG[game.status]

  const handleStatusChange = async (status: GameStatus) => {
    await updateGame(game.id, { status })
    setShowStatusMenu(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${game.title}" ?`)) return
    setDeleting(true)
    await deleteGame(game.id)
  }

  return (
    <div className={`group relative bg-gamer-700 rounded-xl border border-gamer-600 hover:border-gamer-400/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-gamer-400/10 ${deleting ? 'opacity-50 scale-95' : ''}`}>
      <div className="relative h-44 bg-gradient-to-br from-gamer-600 to-gamer-800 overflow-hidden">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-5xl opacity-20">🎮</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gamer-700 via-transparent to-transparent" />

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(game)}
            className="p-1.5 bg-gamer-800/80 backdrop-blur rounded-lg text-slate-300 hover:text-white hover:bg-gamer-400 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-gamer-800/80 backdrop-blur rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-white truncate" title={game.title}>
          {game.title}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-1 rounded-full bg-gamer-500/50 text-slate-300">
            {game.platform}
          </span>
          <div className="flex items-center gap-2">
            {game.playtimeMinutes != null && game.playtimeMinutes > 0 && (
              <span className="flex items-center gap-1 text-xs text-neon-cyan">
                <Clock className="w-3 h-3" />
                {game.playtimeMinutes < 60 ? `${game.playtimeMinutes}min` : `${Math.round(game.playtimeMinutes / 60)}h`}
              </span>
            )}
            {game.genre && (
              <span className="text-xs text-slate-500">{game.genre}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors ${statusConf.bg} ${statusConf.color}`}
            >
              {statusConf.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showStatusMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-gamer-600 border border-gamer-500 rounded-lg shadow-xl py-1 min-w-[140px]">
                  {(Object.entries(STATUS_CONFIG) as [GameStatus, typeof statusConf][]).map(([key, conf]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gamer-500 transition-colors ${key === game.status ? conf.color + ' font-semibold' : 'text-slate-300'}`}
                    >
                      {conf.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < game.priority ? 'text-yellow-400 fill-yellow-400' : 'text-gamer-500'}`}
              />
            ))}
          </div>
        </div>

        {game.rating && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gamer-500 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gamer-400 to-neon-cyan rounded-full transition-all"
                style={{ width: `${game.rating * 10}%` }}
              />
            </div>
            <span className="text-xs text-neon-cyan font-medium">{game.rating}/10</span>
          </div>
        )}
      </div>
    </div>
  )
}
