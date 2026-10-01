import type { ReactNode } from 'react'
import { Button } from './Button'

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      className={`inline-block size-4 animate-spin rounded-full border-2 border-line-strong border-t-brand ${className}`}
    >
      <span className="sr-only">Memuat…</span>
    </span>
  )
}

interface StateBlockProps {
  judul: string
  pesan: string
  aksi?: ReactNode
  ragam?: 'kosong' | 'galat'
}

export function StateBlock({
  judul,
  pesan,
  aksi,
  ragam = 'kosong',
}: StateBlockProps) {
  const galat = ragam === 'galat'
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className={`grid size-11 place-items-center rounded-full ${
          galat ? 'bg-alfa-soft text-alfa' : 'bg-surface-2 text-muted'
        }`}
      >
        {galat ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="none">
            <path
              d="M12 8v5m0 3.5h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-5" fill="none">
            <path
              d="M4 7h16M4 12h16M4 17h10"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-bold text-ink">{judul}</h3>
        <p className="text-[13px] text-muted">{pesan}</p>
      </div>
      {aksi}
    </div>
  )
}

export function TableSkeleton({ baris = 6 }: { baris?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-[10px] border border-line bg-surface"
    >
      <span className="sr-only">Memuat data rekap…</span>
      <div className="h-11 border-b border-line bg-surface-2" />
      {Array.from({ length: baris }).map((_, i) => (
        <div
          key={i}
          className="flex h-12 items-center gap-4 border-b border-line px-4 last:border-b-0"
        >
          <div className="h-3 w-40 rounded bg-surface-2" />
          <div className="h-3 w-52 rounded bg-surface-2" />
          <div className="ml-auto h-3 w-16 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  )
}

export function InlineError({
  pesan,
  onCoba,
}: {
  pesan: string
  onCoba?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[6px] border border-alfa bg-alfa-soft px-3 py-2 text-[13px]">
      <span aria-hidden="true" className="text-alfa">
        ⚠
      </span>
      <span className="flex-1 text-ink">{pesan}</span>
      {onCoba ? (
        <Button ukuran="sm" variasi="sekunder" onClick={onCoba}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  )
}
