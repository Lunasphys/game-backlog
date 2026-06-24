import { Gamepad2, LogOut, User, BarChart3 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b border-gamer-600 bg-gamer-800/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="p-2 bg-gamer-400 rounded-lg shadow-lg shadow-gamer-400/25">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gamer-300 to-neon-cyan bg-clip-text text-transparent">
                GameBacklog
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/' ? 'bg-gamer-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Collection
              </button>
              <button
                onClick={() => navigate('/stats')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${location.pathname === '/stats' ? 'bg-gamer-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-gamer-600 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
