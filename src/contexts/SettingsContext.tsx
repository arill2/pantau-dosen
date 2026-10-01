import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ATURAN_DEFAULT, type AturanHitung } from '@/lib/attendance'

interface PengaturanValue {
  aturan: AturanHitung
  simpanAturan: (next: Partial<AturanHitung>) => void
  resetAturan: () => void
}

const KUNCI = 'pantau-dosen:aturan'
const SettingsContext = createContext<PengaturanValue | null>(null)

function muatAwal(): AturanHitung {
  if (typeof window === 'undefined') return ATURAN_DEFAULT
  try {
    const raw = window.localStorage.getItem(KUNCI)
    if (!raw) return ATURAN_DEFAULT
    const parsed = JSON.parse(raw) as Partial<AturanHitung>
    return { ...ATURAN_DEFAULT, ...parsed }
  } catch {
    return ATURAN_DEFAULT
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [aturan, setAturan] = useState<AturanHitung>(muatAwal)

  useEffect(() => {
    window.localStorage.setItem(KUNCI, JSON.stringify(aturan))
  }, [aturan])

  const simpanAturan = useCallback((next: Partial<AturanHitung>) => {
    setAturan((prev) => ({ ...prev, ...next }))
  }, [])

  const value = useMemo<PengaturanValue>(
    () => ({
      aturan,
      simpanAturan,
      resetAturan: () => setAturan(ATURAN_DEFAULT),
    }),
    [aturan, simpanAturan],
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function usePengaturan(): PengaturanValue {
  const ctx = useContext(SettingsContext)
  if (!ctx)
    throw new Error('usePengaturan harus dipakai di dalam SettingsProvider')
  return ctx
}
