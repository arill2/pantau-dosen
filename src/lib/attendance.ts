import { bulanDariTanggal } from './format'
import type { Pertemuan, PenugasanLengkap, RekapBaris } from './types'

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