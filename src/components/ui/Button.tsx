import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variasi = 'utama' | 'sekunder' | 'halus' | 'bahaya'
type Ukuran = 'sm' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variasi?: Variasi
  ukuran?: Ukuran
  memuat?: boolean
  ikon?: ReactNode
}

const VARIAN: Record<Variasi, string> = {
  utama:
    'bg-brand text-on-brand hover:bg-brand-strong shadow-[0_1px_0_0_color-mix(in_srgb,var(--ink)_12%,transparent)]',
  sekunder:
    'bg-surface text-ink border border-line-strong hover:bg-surface-2',
  halus: 'bg-transparent text-ink hover:bg-surface-2',
  bahaya: 'bg-alfa text-white hover:brightness-110',
}

const UKURAN: Record<Ukuran, string> = {
  sm: 'min-h-11 px-3 text-[13px] gap-1.5 sm:min-h-9',
  md: 'min-h-11 px-4 text-sm gap-2 sm:min-h-10',
}

export function Button({
  variasi = 'sekunder',
  ukuran = 'md',
  memuat = false,
  ikon,
  className = '',
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || memuat}
      aria-busy={memuat || undefined}
      className={`inline-flex items-center justify-center rounded-[6px] font-semibold whitespace-nowrap transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-55 ${VARIAN[variasi]} ${UKURAN[ukuran]} ${className}`}
    >
      {memuat ? (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        ikon
      )}
      {children}
    </button>
  )
}
