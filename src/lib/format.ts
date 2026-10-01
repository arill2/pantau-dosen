const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export const NAMA_BULAN: readonly string[] = BULAN

export const BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const

/** Format tanggal dd-mm-yyyy sesuai kebutuhan non-fungsional PRD. */
export function formatTanggal(value: string | null | undefined): string {
  if (!value) return '–'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '–'
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}-${m}-${date.getFullYear()}`
}

export function formatTanggalSingkat(value: string | null | undefined): string {
  if (!value) return '–'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '–'
  return `${date.getDate()} ${BULAN_SINGKAT[date.getMonth()]}`
}

/** Bulan (0-11) dari string tanggal ISO, atau null. */
export function bulanDariTanggal(value: string | null | undefined): number | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.getMonth()
}

export function formatPersen(value: number | null): string {
  if (value === null) return '–'
  return `${value.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export function formatAngka(value: number): string {
  return value.toLocaleString('id-ID')
}

/** Label yang bisa dibaca untuk nilai status. */
export const STATUS_LABEL: Record<string, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak hadir',
  belum: 'Belum terlaksana',
  izin: 'Izin',
  pengganti: 'Pengganti',
}

export function namaMetode(metode: string): string {
  return metode === 'P' ? 'Praktik' : 'Teori'
}
