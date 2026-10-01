import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type Ragam = 'sukses' | 'galat' | 'info'

interface Toast {
  id: number
  pesan: string
  ragam: Ragam
}

interface ToastValue {
  tampil: (pesan: string, ragam?: Ragam) => void
}

const ToastContext = createContext<ToastValue | null>(null)

const WARNA: Record<Ragam, string> = {
  sukses: 'border-hadir text-hadir',
  galat: 'border-alfa text-alfa',
  info: 'border-line-strong text-ink',
}

const IKON: Record<Ragam, string> = {
  sukses: '✓',
  galat: '⚠',
  info: 'i',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<Toast[]>([])

  const tampil = useCallback((pesan: string, ragam: Ragam = 'info') => {
    const id = Date.now() + Math.random()
    setDaftar((prev) => [...prev, { id, pesan, ragam }])
    window.setTimeout(() => {
      setDaftar((prev) => prev.filter((t) => t.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ tampil }), [tampil])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-atomic="false"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
        >
          {daftar.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-[10px] border-l-4 bg-surface px-4 py-3 shadow-[0_12px_30px_-14px_color-mix(in_srgb,var(--ink)_40%,transparent)] ${WARNA[t.ragam]}`}
            >
              <span aria-hidden="true" className="text-sm font-bold">
                {IKON[t.ragam]}
              </span>
              <p className="text-[13px] text-ink">{t.pesan}</p>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider')
  return ctx
}
