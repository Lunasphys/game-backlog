import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user, loading, fetchMe } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!user && !loading) {
      fetchMe()
    }
  }, [token, user, loading, fetchMe, navigate])

  if (!token) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gamer-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gamer-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
