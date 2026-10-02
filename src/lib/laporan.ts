import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buka, pastikanSiap } from './api'
import { KUNCI_QUERY } from './queryClient'
import { supabase } from './supabase'
import type { DaftarLapor, KelasOpsi, Laporan, StatusLaporan } from './types'

function pesan(m: string): string {
  const l = m.toLowerCase()
  if (l.includes('kelas tidak ditemukan'))
    return 'Kelas tidak ditemukan. Hubungi pengelola.'
  if (l.includes('tidak cocok'))
    return 'Mata kuliah tidak cocok dengan kelas ini.'
  if (l.includes('nama ketua')) return 'Nama ketua kelas wajib diisi.'
  if (l.includes('sudah dilaporkan'))
    return 'Pekan ini sudah pernah dilaporkan untuk mata kuliah ini. Pilih pekan lain.'
  if (l.includes('minggu pertemuan'))
    return 'Minggu pertemuan harus antara 1 sampai 16.'
  if (l.includes('tanggal pembelajaran'))
    return 'Tanggal pembelajaran wajib diisi.'
  if (l.includes('duplicate key')) return 'Data ini sudah ada, tidak boleh ganda.'
  return m
}

// ---------------------------------------------------------------------------
// Publik (taruna / ketua kelas) - tanpa akun
// ---------------------------------------------------------------------------
export async function laporKelas(): Promise<KelasOpsi[]> {
  const { data, error } = await supabase.rpc('lapor_kelas')
  if (error) throw new Error(pesan(error.message))
  return (data ?? []) as KelasOpsi[]
}

export async function laporDaftarKelas(kelasId: string): Promise<DaftarLapor[]> {
  const { data, error } = await supabase.rpc('lapor_daftar_kelas', {
    p_kelas: kelasId,
  })
  if (error) throw new Error(pesan(error.message))
  return (data ?? []) as DaftarLapor[]
}

export async function laporPekanTerisiKelas(
  kelasId: string,
  penugasanId: string,
): Promise<number[]> {
  const { data, error } = await supabase.rpc('lapor_pekan_terisi_kelas', {
    p_kelas: kelasId,
    p_penugasan: penugasanId,
  })
  if (error) throw new Error(pesan(error.message))
  return (data ?? []) as number[]
}

export interface InputLapor {
  kelasId: string
  namaKetua: string
  penugasanId: string
  minggu: number
  tanggal: string
  waktu: string
  dosenHadir: boolean
  catatan: string
  dokumentasi: string
}

export async function laporKirimKelas(input: InputLapor): Promise<void> {
  const { error } = await supabase.rpc('lapor_kirim_kelas', {
    p_kelas: input.kelasId,
    p_nama_ketua: input.namaKetua,
    p_penugasan: input.penugasanId,
    p_minggu: input.minggu,
    p_tanggal: input.tanggal,
    p_waktu: input.waktu || null,
    p_dosen_hadir: input.dosenHadir,
    p_catatan: input.catatan || null,
    p_dokumentasi: input.dokumentasi || null,
  })
  if (error) throw new Error(pesan(error.message))
}

// ---------------------------------------------------------------------------
// Admin: log & verifikasi
// ---------------------------------------------------------------------------
const SELECT_LAPORAN = `
  id, kelas_id, penugasan_id, nama_ketua, mata_kuliah, nama_dosen, tipe,
  minggu_ke, tanggal, waktu, dosen_hadir, catatan, dokumentasi_url, status,
  catatan_verifikasi, diverifikasi_oleh, diverifikasi_pada, dibuat_pada,
  kelas:kelas_id ( id, nama, program, semester, paralel, angkatan )
`

export function useLaporan() {
  return useQuery({
    queryKey: KUNCI_QUERY.laporan,
    queryFn: async (): Promise<Laporan[]> => {
      pastikanSiap()
      const UKURAN = 1000
      const semua: Laporan[] = []
      for (let dari = 0; ; dari += UKURAN) {
        const hasil = await supabase
          .from('laporan')
          .select(SELECT_LAPORAN)
          .order('dibuat_pada', { ascending: false })
          .range(dari, dari + UKURAN - 1)
        const data = buka(hasil) as unknown as Laporan[]
        semua.push(...data)
        if (data.length < UKURAN) break
      }
      return semua
    },
  })
}

export interface InputUbahLaporan {
  id: string
  namaKetua: string
  penugasanId: string
  minggu: number
  tanggal: string
  waktu: string
  dosenHadir: boolean
  catatan: string
  dokumentasi: string
}

/** Admin mengubah laporan ketua kelas (hanya status 'baru'). */
export function useUbahLaporan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InputUbahLaporan) => {
      pastikanSiap()
      const { error } = await supabase.rpc('lapor_admin_ubah', {
        p_id: input.id,
        p_nama_ketua: input.namaKetua,
        p_penugasan: input.penugasanId,
        p_minggu: input.minggu,
        p_tanggal: input.tanggal,
        p_waktu: input.waktu || null,
        p_dosen_hadir: input.dosenHadir,
        p_catatan: input.catatan || null,
        p_dokumentasi: input.dokumentasi || null,
      })
      if (error) throw new Error(pesan(error.message))
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.laporan }),
  })
}

export function useTolakLaporan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; alasan: string }) => {
      pastikanSiap()
      const hasil = await supabase
        .from('laporan')
        .update({
          status: 'ditolak',
          catatan_verifikasi: input.alasan.trim() || null,
          diverifikasi_pada: new Date().toISOString(),
        })
        .eq('id', input.id)
      if (hasil.error) buka(hasil)
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.laporan }),
  })
}

/** Admin menerima laporan: tulis ke rekap pertemuan + tandai terverifikasi. */
export function useTerapkanLaporan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (laporan: Laporan) => {
      pastikanSiap()
      if (!laporan.penugasan_id || laporan.minggu_ke === null)
        throw new Error('Laporan ini tidak memiliki penugasan/pekan.')
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const hasil = await supabase.from('pertemuan').upsert(
        {
          penugasan_id: laporan.penugasan_id,
          minggu_ke: laporan.minggu_ke,
          tanggal: laporan.tanggal,
          status: laporan.dosen_hadir ? 'hadir' : 'tidak_hadir',
          catatan: laporan.catatan,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'penugasan_id,minggu_ke' },
      )
      if (hasil.error) buka(hasil)
      const upd = await supabase
        .from('laporan')
        .update({
          status: 'terverifikasi',
          diverifikasi_oleh: user?.id ?? null,
          diverifikasi_pada: new Date().toISOString(),
        })
        .eq('id', laporan.id)
      if (upd.error) buka(upd)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.laporan })
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.rekap })
    },
  })
}

export type { StatusLaporan }