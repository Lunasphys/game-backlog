import { useEffect, useState } from 'react'
import { BarChart3, Gamepad2, Clock, Trophy, Percent, Activity, Wifi, WifiOff } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { io, Socket } from 'socket.io-client'
import api from '../lib/api'
import Navbar from '../components/Navbar'

const COLORS = ['#7c3aed', '#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316']

const STATUS_LABELS: Record<string, string> = {
  wishlist: 'Wishlist',
  backlog: 'Backlog',
  playing: 'En cours',
  completed: 'Terminé',
  abandoned: 'Abandonné',
}

interface Stats {
  totalGames: number
  totalPlaytime: number
  completionRate: number
  avgPlaytime: number
  completedCount: number
  byGenre: { genre: string; count: number; playtime: number }[]
  byStatus: { status: string; count: number }[]
  byPlatform: { platform: string; count: number }[]
  topGames: { title: string; playtime: number; coverUrl?: string; status: string }[]
  recentGames: { title: string; status: string; updatedAt: string }[]
}

interface LiveEvent {
  type: string
  data: { title: string; status?: string }
  time: string
}

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001'

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  return `${Math.round(minutes / 60)}h`
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<LiveEvent[]>([])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/stats')
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => {
    fetchStats()

    const socket: Socket = io(WS_URL, { transports: ['websocket', 'polling'] })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    const handleEvent = (type: string) => (data: { title: string; status?: string }) => {
      setEvents((prev) => [
        { type, data, time: new Date().toLocaleTimeString('fr-FR') },
        ...prev.slice(0, 19),
      ])
      fetchStats()
    }

    socket.on('game:added', handleEvent('game:added'))
    socket.on('game:updated', handleEvent('game:updated'))
    socket.on('game:deleted', handleEvent('game:deleted'))

    return () => { socket.disconnect() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gamer-900">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-gamer-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!stats) return null

  const statusData = stats.byStatus.map((s) => ({ ...s, name: STATUS_LABELS[s.status] || s.status }))
  const genrePlaytimeData = stats.byGenre.slice(0, 8).map((g) => ({ name: g.genre, value: Math.round(g.playtime / 60) }))
  const platformData = stats.byPlatform.slice(0, 6)

  return (
    <div className="min-h-screen bg-gamer-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection status */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-gamer-300" />
            Dashboard temps réel
          </h1>
          <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? 'Connecté' : 'Déconnecté'}
          </div>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <HeroCard icon={<Gamepad2 className="w-6 h-6" />} label="Total jeux" value={stats.totalGames} color="text-gamer-300" />
          <HeroCard icon={<Clock className="w-6 h-6" />} label="Heures jouées" value={Math.round(stats.totalPlaytime / 60)} suffix="h" color="text-neon-cyan" />
          <HeroCard icon={<Trophy className="w-6 h-6" />} label="Terminés" value={stats.completedCount} color="text-yellow-400" />
          <HeroCard icon={<Percent className="w-6 h-6" />} label="Complétion" value={stats.completionRate} suffix="%" color="text-neon-pink" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* By status pie */}
          <div className="bg-gamer-800 border border-gamer-600 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Jeux par statut</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" nameKey="name" label={({ name, value }) => `${name} (${value})`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1025', border: '1px solid #3b2554', borderRadius: 8, color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Playtime by genre */}
          <div className="bg-gamer-800 border border-gamer-600 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Heures par genre</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={genrePlaytimeData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={90} />
                <Tooltip contentStyle={{ background: '#1a1025', border: '1px solid #3b2554', borderRadius: 8, color: '#e2e8f0' }} formatter={(v) => `${v}h`} />
                <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top games */}
          <div className="bg-gamer-800 border border-gamer-600 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Top 5 — Temps de jeu</h3>
            <div className="space-y-3">
              {stats.topGames.map((game, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gamer-300 w-6">{i + 1}</span>
                  {game.coverUrl && <img src={game.coverUrl} alt="" className="w-16 h-8 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{game.title}</p>
                    <div className="mt-1 h-1.5 bg-gamer-600 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-gamer-400 to-neon-cyan rounded-full" style={{ width: `${Math.min(100, (game.playtime / (stats.topGames[0]?.playtime || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-sm text-neon-cyan font-mono">{formatHours(game.playtime)}</span>
                </div>
              ))}
              {stats.topGames.length === 0 && <p className="text-slate-500 text-sm">Aucune donnée de temps de jeu</p>}
            </div>
          </div>

          {/* By platform */}
          <div className="bg-gamer-800 border border-gamer-600 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Jeux par plateforme</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="platform" label={({ name, value }) => `${name} (${value})`}>
                  {platformData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1025', border: '1px solid #3b2554', borderRadius: 8, color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live activity feed */}
        <div className="bg-gamer-800 border border-gamer-600 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-neon-green" />
            Activité en temps réel
            {connected && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
          </h3>
          {events.length === 0 ? (
            <p className="text-slate-500 text-sm">En attente d'activité... Ajoute ou modifie un jeu pour voir les events ici.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-gamer-700/50">
                  <span className="text-xs text-slate-500 font-mono">{e.time}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    e.type === 'game:added' ? 'bg-green-500/20 text-green-400' :
                    e.type === 'game:deleted' ? 'bg-red-500/20 text-red-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {e.type === 'game:added' ? 'Ajouté' : e.type === 'game:deleted' ? 'Supprimé' : 'Modifié'}
                  </span>
                  <span className="text-white">{e.data.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function HeroCard({ icon, label, value, suffix, color }: { icon: React.ReactNode; label: string; value: number; suffix?: string; color: string }) {
  return (
    <div className="bg-gamer-800 border border-gamer-600 rounded-xl p-5">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-3xl font-bold text-white">{value.toLocaleString('fr-FR')}{suffix}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  )
}
