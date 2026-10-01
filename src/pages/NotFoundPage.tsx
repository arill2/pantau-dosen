import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="w-full max-w-md text-center">
        <p className="tnum text-5xl font-extrabold text-brand">404</p>
        <h1 className="mt-3 text-lg font-bold text-ink">Halaman tidak ditemukan</h1>
        <p className="mt-1 text-[13px] text-muted">
          Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-[6px] bg-brand px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-strong"
        >
          Kembali ke Dashboard Rekap
        </Link>
      </div>
    </div>
  )
}
