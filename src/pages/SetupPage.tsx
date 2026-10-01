import { Database, KeyRound, Rocket } from 'lucide-react'

const LANGKAH = [
  {
    ikon: Rocket,
    judul: 'Buat proyek Supabase',
    isi: 'Buka supabase.com, buat proyek baru, lalu tunggu sampai database siap.',
  },
  {
    ikon: Database,
    judul: 'Jalankan skema',
    isi: 'Buka SQL Editor, tempel isi file supabase/schema.sql, lalu Run.',
  },
  {
    ikon: KeyRound,
    judul: 'Isi kredensial',
    isi: 'Salin .env.example menjadi .env, isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dari Project Settings > API.',
  },
]

export function SetupPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center gap-3">
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
          <div>
            <h1 className="text-lg font-extrabold text-ink">
              Pantau Dosen belum tersambung
            </h1>
            <p className="text-[13px] text-muted">
              Selesaikan tiga langkah berikut, lalu muat ulang halaman ini.
            </p>
          </div>
        </div>

        <ol className="flex flex-col gap-3">
          {LANGKAH.map((l, i) => {
            const Ikon = l.ikon
            return (
              <li
                key={l.judul}
                className="flex gap-4 rounded-[10px] border border-line bg-surface p-4"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[6px] bg-brand-soft text-brand-strong">
                  <Ikon className="size-[18px]" aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-ink">
                    <span className="tnum mr-1.5 text-muted">{i + 1}.</span>
                    {l.judul}
                  </p>
                  <p className="text-[13px] text-muted">{l.isi}</p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="mt-5 rounded-[10px] border border-line bg-surface-2 p-4">
          <p className="text-[13px] font-semibold text-ink">
            Membuat admin pertama
          </p>
          <p className="mt-1 text-[13px] text-muted">
            Di Supabase, buka Authentication &gt; Users &gt; Add user. Isi email
            seperti{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 text-[12px] text-ink">
              admin@pantau-dosen.local
            </code>{' '}
            dan kata sandi pilihan Anda. Saat masuk, cukup ketik{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 text-[12px] text-ink">
              admin
            </code>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 h-10 w-full rounded-[6px] bg-brand text-sm font-semibold text-on-brand transition-colors hover:bg-brand-strong"
        >
          Muat ulang halaman
        </button>
      </div>
    </div>
  )
}
