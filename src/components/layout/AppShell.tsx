import { LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { BrandMark, Navigasi } from './Sidebar'

const JUDUL: Record<string, { judul: string; keterangan: string }> = {
  '/': { judul: 'Dashboard Rekap', keterangan: 'Kehadiran dosen per pekan' },
  '/dosen': { judul: 'Dosen', keterangan: 'Master data dosen' },
  '/mata-kuliah': { judul: 'Mata kuliah', keterangan: 'Master mata kuliah' },
  '/kelas': { judul: 'Kelas', keterangan: 'Master kelas' },
  '/periode': { judul: 'Periode', keterangan: 'Semester dan tahun ajaran' },
  '/penugasan': { judul: 'Penugasan', keterangan: 'Dosen, mata kuliah, metode' },
  '/pengaturan': { judul: 'Pengaturan', keterangan: 'Akun dan aturan perhitungan' },
}

export function AppShell() {
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  const { profil, pengguna, keluar } = useAuth()
  const { tema, toggle } = useTheme()

  useEffect(() => {
    setDrawer(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawer])

  useEffect(() => {
    if (!drawer) return
    function padaTombol(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawer(false)
    }
    window.addEventListener('keydown', padaTombol)
    return () => window.removeEventListener('keydown', padaTombol)
  }, [drawer])

  const info = JUDUL[pathname] ?? { judul: 'Halaman', keterangan: '' }
  const nama = profil?.nama || profil?.username || pengguna?.email?.split('@')[0] || 'Admin'

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[264px_1fr]">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-surface px-3 py-5 lg:flex">
        <div className="px-1.5">
          <BrandMark />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Navigasi />
        </div>
        <div className="rounded-[10px] border border-line bg-paper px-3 py-3">
          <p className="truncate text-[13px] font-semibold text-ink">{nama}</p>
          <p className="text-[11px] text-muted">Admin</p>
        </div>
      </aside>

      {/* Drawer mobile */}
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--ink)_55%,transparent)]"
          />
          <div className="relative z-10 flex h-full w-[82%] max-w-xs flex-col gap-6 border-r border-line bg-surface px-3 py-5">
            <div className="flex items-center justify-between px-1.5">
              <BrandMark />
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Tutup menu"
                className="grid size-11 place-items-center rounded-[6px] text-muted hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Navigasi onPilih={() => setDrawer(false)} />
            </div>
            <button
              type="button"
              onClick={() => void keluar()}
              className="flex min-h-11 items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="size-[18px]" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur-sm lg:px-8">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Buka menu navigasi"
            className="grid size-11 shrink-0 place-items-center rounded-[6px] border border-line-strong bg-surface text-ink lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold text-ink sm:text-base">
              {info.judul}
            </h1>
            {info.keterangan ? (
              <p className="hidden truncate text-xs text-muted sm:block">
                {info.keterangan}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label={tema === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
            className="grid size-11 shrink-0 place-items-center rounded-[6px] border border-line-strong bg-surface text-ink transition-colors hover:bg-surface-2"
          >
            {tema === 'dark' ? (
              <Sun className="size-[18px]" aria-hidden="true" />
            ) : (
              <Moon className="size-[18px]" aria-hidden="true" />
            )}
          </button>

          <Link
            to="/pengaturan"
            className="hidden items-center gap-2 rounded-[6px] border border-line-strong bg-surface py-1.5 pr-3 pl-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-2 sm:flex"
          >
            <span className="grid size-6 place-items-center rounded-full bg-brand text-[11px] font-bold text-on-brand">
              {nama.slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-28 truncate">{nama}</span>
          </Link>

          <button
            type="button"
            onClick={() => void keluar()}
            aria-label="Keluar dari akun"
            className="grid size-11 shrink-0 place-items-center rounded-[6px] border border-line-strong bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-alfa"
          >
            <LogOut className="size-[18px]" aria-hidden="true" />
          </button>
        </header>

        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-7">
          <Outlet />
        </main>

        <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted lg:px-8">
          Pantau Dosen · Rekap Monitoring Pembelajaran Taruna
        </footer>
      </div>
    </div>
  )
}
