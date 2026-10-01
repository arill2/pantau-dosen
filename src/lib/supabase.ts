import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
// Terima URL apa adanya, termasuk bila pengguna menempelkan endpoint /rest/v1/.
const url = rawUrl
  ?.replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
export const authEmailDomain =
  import.meta.env.VITE_AUTH_EMAIL_DOMAIN?.trim() || 'pantau-dosen.local'

export const isSupabaseConfigured = Boolean(
  url && anonKey && url.startsWith('http') && !url.includes('xxxxxxxxxxxx'),
)

/**
 * Klien Supabase. Saat kredensial belum diisi, aplikasi menampilkan halaman
 * panduan setup, bukan error mentah, jadi build tetap bisa dibuka.
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? url! : 'http://localhost:54321',
  isSupabaseConfigured ? anonKey! : 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)

/** Terima "admin" atau "admin@domain" dan kembalikan email yang valid. */
export function identitasKeEmail(identifier: string): string {
  const value = identifier.trim()
  if (value.includes('@')) return value
  return `${value}@${authEmailDomain}`
}
