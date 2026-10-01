import { isSupabaseConfigured } from './supabase'

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Ubah error Supabase/JS menjadi pesan Bahasa Indonesia yang jelas. */
export function pesanError(error: unknown): string {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.'
  if (error instanceof ApiError) return error.message

  const raw =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error)
  const lower = raw.toLowerCase()

  if (lower.includes('failed to fetch') || lower.includes('networkerror'))
    return 'Tidak dapat menghubungi server. Periksa koneksi internet Anda.'
  if (lower.includes('duplicate key') && lower.includes('penugasan'))
    return 'Penugasan dengan dosen, mata kuliah, dan metode ini sudah ada di periode tersebut.'
  if (lower.includes('duplicate key') && lower.includes('mata_kuliah'))
    return 'Kode mata kuliah sudah dipakai.'
  if (lower.includes('duplicate key') && lower.includes('periode'))
    return 'Hanya satu periode boleh berstatus aktif.'
  if (lower.includes('violates foreign key'))
    return 'Data ini masih dipakai pada penugasan lain, jadi belum bisa dihapus.'
  if (lower.includes('jwt') || lower.includes('token'))
    return 'Sesi Anda berakhir. Silakan masuk kembali.'
  if (lower.includes('row level security') || lower.includes('permission denied'))
    return 'Anda tidak punya izin untuk tindakan ini.'
  return raw
}

export function pastikanSiap() {
  if (!isSupabaseConfigured)
    throw new ApiError(
      'Supabase belum dikonfigurasi. Isi file .env terlebih dahulu.',
    )
}

type Hasil<T> = { data: T | null; error: { message: string } | null }

/** Lempar bila error, kembalikan data bila sukses. */
export function buka<T>(hasil: Hasil<T>): T {
  if (hasil.error) throw new ApiError(pesanError(hasil.error))
  return hasil.data as T
}
