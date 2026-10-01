import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Field, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { InlineError } from '@/components/ui/Feedback'
import { useAuth } from '@/contexts/AuthContext'
import { authEmailDomain, isSupabaseConfigured } from '@/lib/supabase'
import { pesanError } from '@/lib/api'

export function LoginPage() {
  const { sesi, masuk } = useAuth()
  const navigate = useNavigate()
  const lokasi = useLocation() as { state?: { dari?: string } }
  const [identitas, setIdentitas] = useState('')
  const [kataSandi, setKataSandi] = useState('')
  const [galat, setGalat] = useState<string | null>(null)
  const [memuat, setMemuat] = useState(false)

  if (sesi) return <Navigate to={lokasi.state?.dari ?? '/'} replace />
  if (!isSupabaseConfigured) return <Navigate to="/setup" replace />

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setGalat(null)
    setMemuat(true)
    try {
      await masuk(identitas, kataSandi)
      navigate(lokasi.state?.dari ?? '/', { replace: true })
    } catch (err) {
      setGalat(pesanError(err))
    } finally {
      setMemuat(false)
    }
  }

  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[1.05fr_1fr]">
      {/* Panel identitas */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand p-10 text-on-brand lg:flex">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-[8px] bg-on-brand/15"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none">
              <path
                d="M4 6h7M4 12h7M4 18h7M15 6h5M15 12h3M15 18h5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-base font-extrabold tracking-tight">
            Pantau Dosen
          </span>
        </div>

        <div className="max-w-md space-y-5">
          <h2 className="text-3xl leading-tight font-extrabold">
            Rekap pembelajaran taruna, rapi dalam satu tempat.
          </h2>
          <p className="text-[15px] text-on-brand/85">
            Catat kehadiran dosen untuk 16 pekan, saring per bulan, dan unduh
            laporan tanpa hitung manual.
          </p>
          {/* Motif jalur pekan */}
          <div className="week-track flex h-9 items-stretch gap-px rounded-[6px] bg-on-brand/10 p-1.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className={`flex-1 rounded-[2px] ${
                  i % 7 === 3 ? 'bg-on-brand/30' : 'bg-on-brand/70'
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-on-brand/70">
          Aplikasi internal. Hanya admin yang dapat mengakses.
        </p>
      </section>

      {/* Panel formulir */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-[8px] bg-brand text-on-brand"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none">
                <path
                  d="M4 6h7M4 12h7M4 18h7M15 6h5M15 12h3M15 18h5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-base font-extrabold tracking-tight">
              Pantau Dosen
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-ink">Masuk sebagai admin</h1>
          <p className="mt-1 mb-6 text-[13px] text-muted">
            Gunakan username atau email yang diberikan pengelola sistem.
          </p>

          {galat ? (
            <div className="mb-4">
              <InlineError pesan={galat} />
            </div>
          ) : null}

          <form onSubmit={kirim} className="flex flex-col gap-4" noValidate>
            <Field
              label="Username atau email"
              petunjuk={`Tanpa domain akan dibaca sebagai username@${authEmailDomain}`}
            >
              {(p) => (
                <Input
                  {...p}
                  name="identitas"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={identitas}
                  onChange={(e) => setIdentitas(e.target.value)}
                  placeholder="admin"
                />
              )}
            </Field>

            <Field label="Kata sandi">
              {(p) => (
                <Input
                  {...p}
                  name="kata-sandi"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={kataSandi}
                  onChange={(e) => setKataSandi(e.target.value)}
                  placeholder="••••••••"
                />
              )}
            </Field>

            <Button
              type="submit"
              variasi="utama"
              memuat={memuat}
              className="mt-1 h-11 w-full"
            >
              Masuk
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted">
            Jaga kerahasiaan akun Anda. Untuk mengakhiri sesi, gunakan tombol
            Keluar. Bila lupa kata sandi, hubungi pengelola sistem.
          </p>
        </div>
      </section>
    </div>
  )
}
