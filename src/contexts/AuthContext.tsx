import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { identitasKeEmail, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

interface AuthValue {
  sesi: Session | null
  pengguna: User | null
  profil: Profile | null
  memuat: boolean
  masuk: (identitas: string, kataSandi: string) => Promise<void>
  keluar: () => Promise<void>
  ubahKataSandi: (baru: string) => Promise<void>
  segarkanProfil: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesi, setSesi] = useState<Session | null>(null)
  const [profil, setProfil] = useState<Profile | null>(null)
  const [memuat, setMemuat] = useState(isSupabaseConfigured)

  const muatProfil = useCallback(async (user: User | null) => {
    if (!user || !isSupabaseConfigured) {
      setProfil(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, nama')
      .eq('id', user.id)
      .maybeSingle()
    setProfil(data ?? null)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMemuat(false)
      return
    }
    let aktif = true

    supabase.auth.getSession().then(({ data }) => {
      if (!aktif) return
      setSesi(data.session)
      muatProfil(data.session?.user ?? null).finally(() => {
        if (aktif) setMemuat(false)
      })
    })

    const { data: langganan } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSesi(nextSession)
        void muatProfil(nextSession?.user ?? null)
      },
    )

    return () => {
      aktif = false
      langganan.subscription.unsubscribe()
    }
  }, [muatProfil])

  const masuk = useCallback(async (identitas: string, kataSandi: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: identitasKeEmail(identitas),
      password: kataSandi,
    })
    if (error) throw new Error(pesanMasuk(error.message))
  }, [])

  const keluar = useCallback(async () => {
    await supabase.auth.signOut()
    setProfil(null)
  }, [])

  const ubahKataSandi = useCallback(async (baru: string) => {
    const { error } = await supabase.auth.updateUser({ password: baru })
    if (error) throw new Error(error.message)
  }, [])

  const segarkanProfil = useCallback(
    () => muatProfil(sesi?.user ?? null),
    [muatProfil, sesi],
  )

  const value = useMemo<AuthValue>(
    () => ({
      sesi,
      pengguna: sesi?.user ?? null,
      profil,
      memuat,
      masuk,
      keluar,
      ubahKataSandi,
      segarkanProfil,
    }),
    [sesi, profil, memuat, masuk, keluar, ubahKataSandi, segarkanProfil],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function pesanMasuk(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login')) return 'Identitas atau kata sandi salah.'
  if (lower.includes('email not confirmed'))
    return 'Akun belum dikonfirmasi. Hubungi pengelola sistem.'
  if (lower.includes('rate limit'))
    return 'Terlalu banyak percobaan. Coba lagi beberapa saat.'
  return message
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
