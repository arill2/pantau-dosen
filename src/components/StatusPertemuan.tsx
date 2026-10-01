import type { StatusPertemuan } from '@/lib/types'

interface Meta {
  label: string
  singkat: string
  teks: string
  latar: string
  tanda: string
}

export const STATUS_META: Record<StatusPertemuan, Meta> = {
  hadir: {
    label: 'Hadir',
    singkat: 'H',
    teks: 'text-hadir',
    latar: 'bg-hadir-soft',
    tanda: '✓',
  },
  tidak_hadir: {
    label: 'Tidak hadir',
    singkat: 'TH',
    teks: 'text-alfa',
    latar: 'bg-alfa-soft',
    tanda: '✕',
  },
  belum: {
    label: 'Belum terlaksana',
    singkat: '–',
    teks: 'text-belum',
    latar: 'bg-belum-soft',
    tanda: '–',
  },
  izin: {
    label: 'Izin',
    singkat: 'I',
    teks: 'text-izin',
    latar: 'bg-izin-soft',
    tanda: 'i',
  },
  pengganti: {
    label: 'Pengganti',
    singkat: 'P',
    teks: 'text-izin',
    latar: 'bg-izin-soft',
    tanda: '↺',
  },
}

export const URUTAN_STATUS: StatusPertemuan[] = [
  'hadir',
  'tidak_hadir',
  'izin',
  'pengganti',
  'belum',
]

export function StatusPill({ status }: { status: StatusPertemuan }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${meta.latar} ${meta.teks}`}
    >
      <span aria-hidden="true">{meta.tanda}</span>
      {meta.label}
    </span>
  )
}
