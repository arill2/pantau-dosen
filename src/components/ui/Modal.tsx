import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

interface Props {
  terbuka: boolean
  judul: string
  deskripsi?: string
  onTutup: () => void
  children: ReactNode
  footer?: ReactNode
}

const FOKUS =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function Modal({
  terbuka,
  judul,
  deskripsi,
  onTutup,
  children,
  footer,
}: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const pemicu = useRef<Element | null>(null)

  useEffect(() => {
    if (!terbuka) return
    pemicu.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const timer = window.setTimeout(() => {
      const pertama = panel.current?.querySelector<HTMLElement>(FOKUS)
      ;(pertama ?? panel.current)?.focus()
    }, 20)

    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = overflow
      if (pemicu.current instanceof HTMLElement) pemicu.current.focus()
    }
  }, [terbuka])

  if (!terbuka) return null

  function padaTombol(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onTutup()
      return
    }
    if (e.key !== 'Tab') return
    const elemen = panel.current?.querySelectorAll<HTMLElement>(FOKUS)
    if (!elemen || elemen.length === 0) return
    const pertama = elemen[0]
    const terakhir = elemen[elemen.length - 1]
    if (!e.shiftKey && document.activeElement === terakhir) {
      e.preventDefault()
      pertama.focus()
    } else if (e.shiftKey && document.activeElement === pertama) {
      e.preventDefault()
      terakhir.focus()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--ink)_55%,transparent)] p-0 sm:items-center sm:p-6"
      onKeyDown={padaTombol}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Tutup dialog"
        tabIndex={-1}
        onClick={onTutup}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg rounded-t-[10px] border border-line bg-surface shadow-[0_18px_50px_-20px_color-mix(in_srgb,var(--ink)_45%,transparent)] sm:rounded-[10px]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink">{judul}</h2>
            {deskripsi ? (
              <p className="mt-0.5 text-[13px] text-muted">{deskripsi}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="-mr-1 -mt-1 grid size-11 shrink-0 place-items-center rounded-[6px] text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:size-9"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 pb-6 sm:pb-4">
          {children}
        </div>
        {footer ? (
          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-surface px-5 py-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
