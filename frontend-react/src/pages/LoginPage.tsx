import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gamepad2, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gamer-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gamer-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gamer-400 rounded-2xl shadow-lg shadow-gamer-400/25 mb-4">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gamer-300 to-neon-cyan bg-clip-text text-transparent">
            GameBacklog
          </h1>
          <p className="text-slate-400 mt-2">Connecte-toi pour gérer ta collection</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gamer-800 border border-gamer-600 rounded-2xl p-6 space-y-4 shadow-2xl">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors"
                placeholder="gamer@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-3 py-2.5 bg-gamer-700 border border-gamer-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gamer-400 focus:ring-1 focus:ring-gamer-400 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gamer-400 hover:bg-gamer-300 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-gamer-400/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Connexion
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-slate-400">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-gamer-300 hover:text-gamer-200 font-medium transition-colors">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
