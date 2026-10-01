import { STATUS_META } from './StatusPertemuan'
import { formatTanggalSingkat } from '@/lib/format'
import type { Pertemuan, StatusPertemuan } from '@/lib/types'
import { TOTAL_MINGGU } from '@/lib/attendance'

interface Props {
  pertemuan: Pertemuan[]
  onPilih: (minggu: number) => void
  /** Batasi pekan yang tampil/dapat diubah (mis. filter bulan). */
  bolehDiubah?: (minggu: number) => boolean
}

export function WeekStrip({ pertemuan, onPilih, bolehDiubah }: Props) {
  const peta = new Map(pertemuan.map((p) => [p.minggu_ke, p]))

  return (
    <div
      className="grid grid-cols-4 gap-1.5 sm:grid-cols-8"
      role="list"
      aria-label="Status 16 pekan"
    >
      {Array.from({ length: TOTAL_MINGGU }, (_, i) => i + 1).map((minggu) => {
        const p = peta.get(minggu)
        const status: StatusPertemuan = p?.status ?? 'belum'
        const meta = STATUS_META[status]
        const aktif = bolehDiubah ? bolehDiubah(minggu) : true
        return (
          <button
            key={minggu}
            type="button"
            role="listitem"
            disabled={!aktif}
            onClick={() => onPilih(minggu)}
            aria-label={`Pekan ${minggu}, ${meta.label}${
              p?.tanggal ? `, ${formatTanggalSingkat(p.tanggal)}` : ''
            }`}
            className={`flex min-h-11 flex-col items-center justify-center rounded-[6px] border border-transparent text-[11px] font-bold transition-colors duration-150 ease-out ${meta.latar} ${meta.teks} ${
              aktif
                ? 'hover:border-line-strong'
                : 'cursor-not-allowed opacity-35'
            }`}
          >
            <span className="text-[9px] font-semibold text-muted">{minggu}</span>
            <span aria-hidden="true">{meta.tanda}</span>
          </button>
        )
      })}
    </div>
  )
}

export function MiniTrack({ pertemuan }: { pertemuan: Pertemuan[] }) {
  const peta = new Map(pertemuan.map((p) => [p.minggu_ke, p]))
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: TOTAL_MINGGU }, (_, i) => i + 1).map((minggu) => {
        const status = peta.get(minggu)?.status ?? 'belum'
        return (
          <span
            key={minggu}
            className={`h-4 w-1.5 rounded-full ${STATUS_META[status].latar} border border-[color-mix(in_srgb,var(--ink)_10%,transparent)]`}
          />
        )
      })}
    </div>
  )
}
