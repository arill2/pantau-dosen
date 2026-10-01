import { Navigate, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Feedback'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

function LayarMuat() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper">
      <div className="flex flex-col items-center gap-3 text-muted">
        <Spinner className="size-6" />
        <p className="text-sm">Memeriksa sesi…</p>
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { sesi, memuat } = useAuth()
  const lokasi = useLocation()

  if (!isSupabaseConfigured) return <Navigate to="/setup" replace />
  if (memuat) return <LayarMuat />
  if (!sesi) return <Navigate to="/login" replace state={{ dari: lokasi.pathname }} />

  return <AppShell />
}
