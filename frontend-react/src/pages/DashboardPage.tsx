import { useEffect, useState } from 'react'
import { Plus, Search, Gamepad2, Trophy, Clock, Flame, MonitorPlay, Download } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import type { Game, GameStatus } from '../types'
import Navbar from '../components/Navbar'
import GameCard from '../components/GameCard'
import GameModal from '../components/GameModal'
import SteamSearchModal from '../components/SteamSearchModal'
import SteamImportModal from '../components/SteamImportModal'

const STATUS_TABS: { key: GameStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'playing', label: 'En cours' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'completed', label: 'Terminés' },
  { key: 'abandoned', label: 'Abandonnés' },
]

export default function DashboardPage() {
  const { games, loading, fetchGames, filterStatus, setFilterStatus, searchQuery, setSearchQuery, filteredGames } = useGameStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [steamModalOpen, setSteamModalOpen] = useState(false)
  const [steamImportOpen, setSteamImportOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  const openAdd = () => {
    setEditingGame(null)
    setModalOpen(true)
  }

  const openEdit = (game: Game) => {
    setEditingGame(game)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingGame(null)
  }

  const closeSteamModal = () => {
    setSteamModalOpen(false)
    fetchGames()
  }

  const displayed = filteredGames()

  const stats = {
    total: games.length,
    playing: games.filter((g) => g.status === 'playing').length,
    completed: games.filter((g) => g.status === 'completed').length,
    backlog: games.filter((g) => g.status === 'backlog').length,
  }

  return (
    <div className="min-h-screen bg-gamer-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Gamepad2 className="w-5 h-5" />} label="Total" value={stats.total} color="text-gamer-300" />
          <StatCard icon={<Flame className="w-5 h-5" />} label="En cours" value={stats.playing} color="text-green-400" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Backlog" value={stats.backlog} color="text-orange-400" />
          <StatCard icon={<Trophy className="w-5 h-5" />} label="Terminés" value={stats.completed} color="text-cyan-400" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === tab.key
                    ? 'bg-gamer-400 text-white shadow-lg shadow-gamer-400/25'
                    : 'bg-gamer-700 text-slate-400 hover:text-white hover:bg-gamer-600'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && (
                  <span className="ml-1.5 text-xs opacity-60">
                    {games.filter((g) => g.status === tab.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full sm:w-56 pl-9 pr-3 py-2 bg-gamer-700 border border-gamer-500 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors"
              />
            </div>
            <button
              onClick={() => setSteamImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gamer-700 hover:bg-gamer-600 text-white font-medium rounded-lg transition-colors border border-gamer-500 whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-neon-green" />
              Ma biblio
            </button>
            <button
              onClick={() => setSteamModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gamer-700 hover:bg-gamer-600 text-white font-medium rounded-lg transition-colors border border-gamer-500 whitespace-nowrap"
            >
              <MonitorPlay className="w-4 h-4 text-neon-cyan" />
              Steam
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-gamer-400 hover:bg-gamer-300 text-white font-medium rounded-lg transition-colors shadow-lg shadow-gamer-400/25 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Manuel
            </button>
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gamer-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-gamer-700 rounded-2xl mb-4">
              <Gamepad2 className="w-12 h-12 text-gamer-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              {games.length === 0 ? 'Aucun jeu dans ta collection' : 'Aucun résultat'}
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm">
              {games.length === 0
                ? 'Commence par ajouter ton premier jeu pour suivre ta progression !'
                : 'Essaie de modifier tes filtres ou ta recherche.'
              }
            </p>
            {games.length === 0 && (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-gamer-400 hover:bg-gamer-300 text-white font-medium rounded-lg transition-colors shadow-lg shadow-gamer-400/25"
              >
                <Plus className="w-4 h-4" />
                Ajouter mon premier jeu
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayed.map((game) => (
              <GameCard key={game.id} game={game} onEdit={openEdit} />
            ))}
          </div>
        )}
      </main>

      <GameModal game={editingGame} isOpen={modalOpen} onClose={closeModal} />
      <SteamSearchModal isOpen={steamModalOpen} onClose={closeSteamModal} />
      <SteamImportModal isOpen={steamImportOpen} onClose={() => { setSteamImportOpen(false); fetchGames() }} />
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-gamer-800 border border-gamer-600 rounded-xl p-4 flex items-center gap-3">
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  )
}
