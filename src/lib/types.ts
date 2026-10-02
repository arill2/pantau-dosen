export type Metode = 'T' | 'P'

export type StatusPertemuan =
  | 'hadir'
  | 'tidak_hadir'
  | 'belum'
  | 'izin'
  | 'pengganti'

export interface Dosen {
  id: string
  nama: string
  nidn: string | null
  kode: string | null
  aktif: boolean
  created_at?: string
}

export interface MataKuliah {
  id: string
  kode: string
  nama: string
  sks: number
  sks_t: number
  sks_p: number
  metode_default: Metode
  aktif: boolean
  created_at?: string
}

export interface Periode {
  id: string
  nama: string
  tgl_mulai: string
  tgl_selesai: string
  aktif: boolean
  created_at?: string
}

export interface Kelas {
  id: string
  nama: string
  keterangan: string | null
  program: string | null
  semester: string | null
  angkatan: string | null
  paralel: string | null
  kode_akses: string | null
  aktif: boolean
  created_at?: string
}

export type StatusLaporan = 'baru' | 'terverifikasi' | 'ditolak'

export interface Laporan {
  id: string
  kelas_id: string
  penugasan_id: string | null
  nama_ketua: string
  mata_kuliah: string | null
  nama_dosen: string | null
  tipe: Metode | null
  minggu_ke: number | null
  tanggal: string | null
  waktu: string | null
  dosen_hadir: boolean
  catatan: string | null
  dokumentasi_url: string | null
  status: StatusLaporan
  dibuat_pada: string
  kelas: Pick<
    Kelas,
    'id' | 'nama' | 'program' | 'semester' | 'paralel' | 'angkatan'
  > | null
}

export interface DaftarLapor {
  penugasan_id: string
  mata_kuliah: string
  kode_mk: string
  nama_dosen: string
  metode: Metode
  kelas_nama: string
}

export interface Penugasan {
  id: string
  dosen_id: string
  mata_kuliah_id: string
  periode_id: string
  kelas_id: string
  metode: Metode
  created_at?: string
}

export interface Pertemuan {
  id: string
  penugasan_id: string
  minggu_ke: number
  tanggal: string | null
  status: StatusPertemuan
  catatan: string | null
  updated_at?: string
}

export interface Profile {
  id: string
  username: string | null
  nama: string | null
  created_at?: string
}

/** Penugasan dengan relasi dan seluruh pertemuannya, siap direkap. */
export interface PenugasanLengkap {
  id: string
  metode: Metode
  dosen: Pick<Dosen, 'id' | 'nama' | 'nidn'> | null
  mata_kuliah: Pick<MataKuliah, 'id' | 'kode' | 'nama' | 'sks'> | null
  periode: Pick<Periode, 'id' | 'nama'> | null
  kelas: Pick<Kelas, 'id' | 'nama'> | null
  pertemuan: Pertemuan[]
}

export interface RekapBaris extends PenugasanLengkap {
  totalHadir: number
  totalDihitung: number
  persentase: number | null
}

export interface AuditLog {
  id: number
  actor: string | null
  aksi: string
  entitas: string
  entitas_id: string | null
  nilai_lama: Record<string, unknown> | null
  nilai_baru: Record<string, unknown> | null
  waktu: string
}
