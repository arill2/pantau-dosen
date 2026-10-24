import { bulanDariTanggal } from './format'
import type {
  Pertemuan,
  PenugasanLengkap,
  RekapBaris,
  StatusPertemuan,
} from './types'

export type DasarPerhitungan = 'terlaksana' | 'terjadwal' | 'tetap16'

export interface AturanHitung {
  /** Bagaimana pembagi persentase ditentukan. */
  dasar: DasarPerhitungan
  /** Bila true, status Izin dan Pengganti ikut dihitung sebagai kehadiran. */
  hitungIzinSebagaiHadir: boolean
  /** Ambang batas (%) untuk penanda visual. */
  ambang: number
}

export const ATURAN_DEFAULT: AturanHitung = {
  dasar: 'terlaksana',
  hitungIzinSebagaiHadir: false,
  ambang: 75,
}

export const DASAR_LABEL: Record<DasarPerhitungan, string> = {
  terlaksana: 'Pertemuan terlaksana (Hadir / Tidak hadir / Izin)',
  terjadwal: 'Pertemuan yang sudah bertanggal',
  tetap16: 'Selalu 16 pertemuan',
}

export const TOTAL_MINGGU = 16

export type FilterBulan = 'semua' | number

export function cocokBulan(
  pertemuan: Pertemuan,
  bulan: FilterBulan,
): boolean {
  if (bulan === 'semua') return true
  const b = bulanDariTanggal(pertemuan.tanggal)
  return b !== null && b === bulan
}

/** Status yang dianggap sebagai pertemuan sudah terlaksana. */
function terlaksana(pertemuan: Pertemuan): boolean {
  return pertemuan.status !== 'belum'
}

function dihitungSebagaiHadir(
  pertemuan: Pertemuan,
  aturan: AturanHitung,
): boolean {
  if (pertemuan.status === 'hadir') return true
  if (aturan.hitungIzinSebagaiHadir) {
    return pertemuan.status === 'izin' || pertemuan.status === 'pengganti'
  }
  return false
}

function tentukanPembagi(
  pertemuan: Pertemuan[],
  aturan: AturanHitung,
): number {
  switch (aturan.dasar) {
    case 'tetap16':
      return TOTAL_MINGGU
    case 'terjadwal':
      return pertemuan.filter((p) => p.tanggal !== null).length
    case 'terlaksana':
    default:
      return pertemuan.filter(terlaksana).length
  }
}

/**
 * Hitung ulang satu penugasan berdasarkan filter dan aturan yang aktif.
 * Persentase = total hadir / pembagi * 100, dibulatkan 1 desimal.
 */
export function hitungRekap(
  penugasan: PenugasanLengkap,
  bulan: FilterBulan,
  aturan: AturanHitung,
): RekapBaris {
  const dalamFilter = penugasan.pertemuan.filter((p) => cocokBulan(p, bulan))
  const totalHadir = dalamFilter.filter((p) =>
    dihitungSebagaiHadir(p, aturan),
  ).length
  const pembagi = tentukanPembagi(dalamFilter, aturan)

  return {
    ...penugasan,
    totalHadir,
    totalDihitung: pembagi,
    persentase:
      pembagi > 0 ? Math.round((totalHadir / pembagi) * 1000) / 10 : null,
  }
}

export interface RingkasanRekap {
  jumlahPenugasan: number
  jumlahDosen: number
  totalHadir: number
  rataPersentase: number | null
  diBawahAmbang: number
}

export function ringkasRekap(
  baris: RekapBaris[],
  aturan: AturanHitung,
): RingkasanRekap {
  const denganNilai = baris.filter((b) => b.persentase !== null)
  const jumlahDosen = new Set(baris.map((b) => b.dosen?.id).filter(Boolean)).size

  return {
    jumlahPenugasan: baris.length,
    jumlahDosen,
    totalHadir: baris.reduce((sum, b) => sum + b.totalHadir, 0),
    rataPersentase: denganNilai.length
      ? Math.round(
          (denganNilai.reduce((s, b) => s + (b.persentase as number), 0) /
            denganNilai.length) *
            10,
        ) / 10
      : null,
    diBawahAmbang: denganNilai.filter(
      (b) => (b.persentase as number) < aturan.ambang,
    ).length,
  }
}

// ---------------------------------------------------------------------------
// Rekap per tanggal
// ---------------------------------------------------------------------------
export interface BarisTanggal {
  penugasan: PenugasanLengkap
  pertemuan: Pertemuan
}

/** Apakah pertemuan jatuh pada tanggal ISO (yyyy-mm-dd) tertentu. */
export function cocokTanggal(pertemuan: Pertemuan, tanggal: string): boolean {
  return tanggal !== '' && pertemuan.tanggal === tanggal
}

/** Semua pertemuan pada tanggal tertentu, beserta penugasan induknya. */
export function daftarPertemuanTanggal(
  list: PenugasanLengkap[],
  tanggal: string,
): BarisTanggal[] {
  if (!tanggal) return []
  return list.flatMap((penugasan) =>
    penugasan.pertemuan
      .filter((p) => cocokTanggal(p, tanggal))
      .map((pertemuan) => ({ penugasan, pertemuan })),
  )
}

export interface RingkasanTanggal {
  jumlahPertemuan: number
  jumlahDosen: number
  hadir: number
  tidakHadir: number
  izin: number
  pengganti: number
  belum: number
  /** Persentase hadir dari pertemuan yang sudah dicatat (selain "belum"). */
  persentaseHadir: number | null
}

export function ringkasTanggal(
  baris: BarisTanggal[],
  hitungIzinSebagaiHadir = false,
): RingkasanTanggal {
  const dosen = new Set<string>()
  let hadir = 0
  let hadirEfektif = 0
  let tidakHadir = 0
  let izin = 0
  let pengganti = 0
  let belum = 0

  for (const { penugasan, pertemuan } of baris) {
    if (penugasan.dosen?.id) dosen.add(penugasan.dosen.id)
    switch (pertemuan.status) {
      case 'hadir':
        hadir += 1
        hadirEfektif += 1
        break
      case 'tidak_hadir':
        tidakHadir += 1
        break
      case 'izin':
        izin += 1
        if (hitungIzinSebagaiHadir) hadirEfektif += 1
        break
      case 'pengganti':
        pengganti += 1
        if (hitungIzinSebagaiHadir) hadirEfektif += 1
        break
      default:
        belum += 1
    }
  }

  const dihitung = hadir + tidakHadir + izin + pengganti
  return {
    jumlahPertemuan: baris.length,
    jumlahDosen: dosen.size,
    hadir,
    tidakHadir,
    izin,
    pengganti,
    belum,
    persentaseHadir:
      dihitung > 0 ? Math.round((hadirEfektif / dihitung) * 1000) / 10 : null,
  }
}

// ---------------------------------------------------------------------------
// Filter status kehadiran
// ---------------------------------------------------------------------------
export type StatusFilter = 'semua' | StatusPertemuan

export const STATUS_URUT: StatusPertemuan[] = [
  'hadir',
  'tidak_hadir',
  'izin',
  'pengganti',
  'belum',
]

export type HitungStatus = Record<StatusPertemuan, number>

/** Jumlah pertemuan per status dalam filter bulan yang aktif. */
export function rekapStatus(
  penugasan: PenugasanLengkap,
  bulan: FilterBulan,
): HitungStatus {
  const hasil: HitungStatus = {
    hadir: 0,
    tidak_hadir: 0,
    izin: 0,
    pengganti: 0,
    belum: 0,
  }
  for (const p of penugasan.pertemuan) {
    if (cocokBulan(p, bulan)) hasil[p.status] += 1
  }
  return hasil
}

/** Apakah penugasan punya minimal satu pertemuan dengan status tsb. */
export function adaStatus(
  penugasan: PenugasanLengkap,
  bulan: FilterBulan,
  status: StatusPertemuan,
): boolean {
  return penugasan.pertemuan.some(
    (p) => cocokBulan(p, bulan) && p.status === status,
  )
}