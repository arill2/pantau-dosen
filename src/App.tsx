import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardPage } from '@/pages/DashboardPage'
import { DosenPage } from '@/pages/DosenPage'
import { LoginPage } from '@/pages/LoginPage'
import { MataKuliahPage } from '@/pages/MataKuliahPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PengaturanPage } from '@/pages/PengaturanPage'
import { PenugasanPage } from '@/pages/PenugasanPage'
import { PeriodePage } from '@/pages/PeriodePage'
import { SetupPage } from '@/pages/SetupPage'

export function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="/dosen" element={<DosenPage />} />
        <Route path="/mata-kuliah" element={<MataKuliahPage />} />
        <Route path="/periode" element={<PeriodePage />} />
        <Route path="/penugasan" element={<PenugasanPage />} />
        <Route path="/pengaturan" element={<PengaturanPage />} />
      </Route>

      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
