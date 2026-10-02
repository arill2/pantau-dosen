import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buka, pastikanSiap } from './api'
import { KUNCI_QUERY } from './queryClient'
import { supabase } from './supabase'
import type { DaftarLapor, Laporan, StatusLaporan } from './types'

/** Publik: daftar penugasan untuk satu kelas berdasarkan kode akses. */
export async function laporDaftar(kode: string): Promise<DaftarLapor[]> {
  const { data, error } = await supabase.rpc('lapor_daftar', { p_kode: kode })
  if (error) throw new Error(pesan(error.message))
  return (data ?? []) as DaftarLapor[]
}

/** Publik: pekan yang sudah dilaporkan untuk satu penugasan (cegah duplikat). */
export async function laporPekanTerisi(
  kode: string,
  penugasanId: string,
): Promise<number[]> {
  const { data, error } = await supabase.rpc('lapor_pekan_terisi', {
    p_kode: kode,
    p_penugasan: penugasanId,
  })
  if (error) throw new Error(pesan(error.message))
  return (data ?? []) as number[]
}

export interface InputLapor {
  kode: string
  namaKetua: string
  penugasanId: string
  minggu: number
  tanggal: string
  waktu: string
  dosenHadir: boolean
  catatan: string
  dokumentasi: string
}

/** Publik: kirim laporan ketua kelas. */
export async function laporKirim(input: InputLapor): Promise<void> {
  const { error } = await supabase.rpc('lapor_kirim', {
    p_kode: input.kode,
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

function pesan(m: string): string {
  const l = m.toLowerCase()
  if (l.includes('kode kelas tidak valid'))
    return 'Kode kelas tidak ditemukan. Periksa kembali kode dari admin.'
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
// Admin
// ---------------------------------------------------------------------------
const SELECT_LAPORAN = `
  id, kelas_id, penugasan_id, nama_ketua, mata_kuliah, nama_dosen, tipe,
  minggu_ke, tanggal, waktu, dosen_hadir, catatan, dokumentasi_url, status, dibuat_pada,
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

export function useUbahStatusLaporan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; status: StatusLaporan }) => {
      pastikanSiap()
      const hasil = await supabase
        .from('laporan')
        .update({ status: input.status })
        .eq('id', input.id)
      if (hasil.error) buka(hasil)
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.laporan }),
  })
}

/** Terapkan laporan ke rekap pertemuan (status hadir/tidak hadir). */
export function useTerapkanLaporan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (laporan: Laporan) => {
      pastikanSiap()
      if (!laporan.penugasan_id || laporan.minggu_ke === null)
        throw new Error('Laporan ini tidak memiliki penugasan/pekan.')
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
        .update({ status: 'terverifikasi' })
        .eq('id', laporan.id)
      if (upd.error) buka(upd)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.laporan })
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.rekap })
    },
  })
}
