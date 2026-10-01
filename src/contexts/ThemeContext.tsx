import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Tema = 'light' | 'dark'

interface ThemeValue {
  tema: Tema
  setTema: (tema: Tema) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)
const KUNCI = 'pantau-dosen:tema'

function temaAwal(): Tema {
  if (typeof window === 'undefined') return 'light'
  const tersimpan = window.localStorage.getItem(KUNCI)
  if (tersimpan === 'light' || tersimpan === 'dark') return tersimpan
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(temaAwal)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', tema === 'dark')
    root.style.colorScheme = tema
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', tema === 'dark' ? '#16130F' : '#F7F4EF')
    window.localStorage.setItem(KUNCI, tema)
  }, [tema])

  const setTema = useCallback((next: Tema) => setTemaState(next), [])

  const value = useMemo<ThemeValue>(
    () => ({
      tema,
      setTema,
      toggle: () => setTemaState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [tema, setTema],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme harus dipakai di dalam ThemeProvider')
  return ctx
}
