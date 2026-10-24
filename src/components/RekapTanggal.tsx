import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DenganNomorUrut } from '@/components/NomorUrut'
import { STATUS_META } from '@/components/StatusPertemuan'
import type { BarisTanggal } from '@/lib/attendance'
import type { PenugasanLengkap } from '@/lib/types'

interface Props {
  baris: BarisTanggal[]
  /** Nomor urut baris pertama pada halaman ini. */
  mulai: number
  onPilih: (penugasan: PenugasanLengkap, minggu: number) => void
}

function LabelStatus({ status }: { status: BarisTanggal['pertemuan']['status'] }) {
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

export function RekapTanggal({ baris, mulai, onPilih }: Props) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[10px] border border-line bg-surface lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <caption className="sr-only">
              Daftar pertemuan pada tanggal yang dipilih
            </caption>
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-2 text-left">
                <th scope="col" className="min-w-52 px-4 py-3 font-semibold">
                  Dosen
                </th>
                <th scope="col" className="min-w-56 px-4 py-3 font-semibold">
                  Mata kuliah
                </th>
                <th scope="col" className="min-w-28 px-4 py-3 font-semibold">
                  Kelas
                </th>
                <th scope="col" className="w-16 px-2 py-3 text-center font-semibold">
                  T/P
                </th>
                <th scope="col" className="w-20 px-2 py-3 text-center font-semibold">
                  Pekan
                </th>
                <th scope="col" className="min-w-40 px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="min-w-48 px-4 py-3 font-semibold">
                  Catatan
                </th>
                <th scope="col" className="w-24 px-3 py-3 text-right font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {baris.map(({ penugasan, pertemuan }, indeks) => (
                <tr
                  key={`${penugasan.id}-${pertemuan.minggu_ke}`}
                  className="row-stripe border-t border-line align-middle"
                >
                  <th scope="row" className="px-4 py-2.5 text-left font-semibold">
                    <DenganNomorUrut nomor={mulai + indeks + 1}>
                      <span className="min-w-0">
                        <span className="block max-w-52 truncate">
                          {penugasan.dosen?.nama ?? '–'}
                        </span>
                        {penugasan.dosen?.nidn ? (
                          <span className="tnum block text-[11px] font-normal text-muted">
                            {penugasan.dosen.nidn}
                          </span>
                        ) : null}
                      </span>
                    </DenganNomorUrut>
                  </th>
                  <td className="px-4 py-2.5">
                    <span className="block max-w-56 truncate">
                      {penugasan.mata_kuliah?.nama ?? '–'}
                    </span>
                    <span className="text-[11px] text-muted">
                      {penugasan.mata_kuliah?.kode ?? ''}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="block max-w-28 truncate text-ink">
                      {penugasan.kelas?.nama ?? '–'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="inline-grid size-6 place-items-center rounded-[4px] bg-brand-soft text-[11px] font-bold text-brand-strong">
                      {penugasan.metode}
                    </span>
                  </td>
                  <td className="tnum px-2 py-2.5 text-center font-bold text-ink">
                    {pertemuan.minggu_ke}
                  </td>
                  <td className="px-4 py-2.5">
                    <LabelStatus status={pertemuan.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="block max-w-48 truncate text-muted"
                      title={pertemuan.catatan ?? undefined}
                    >
                      {pertemuan.catatan ?? '–'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      ukuran="sm"
                      variasi="sekunder"
                      onClick={() => onPilih(penugasan, pertemuan.minggu_ke)}
                      ikon={<Pencil className="size-3.5" />}
                    >
                      Ubah
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {baris.map(({ penugasan, pertemuan }, indeks) => (
          <article
            key={`${penugasan.id}-${pertemuan.minggu_ke}`}
            className="rounded-[10px] border border-line bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-bold text-ink">
                  <DenganNomorUrut nomor={mulai + indeks + 1}>
                    <span className="min-w-0 truncate">
                      {penugasan.dosen?.nama ?? '–'}
                    </span>
                  </DenganNomorUrut>
                </h3>
                <p className="truncate text-[13px] text-muted">
                  {penugasan.mata_kuliah?.kode} · {penugasan.mata_kuliah?.nama}
                </p>
                <p className="mt-1 text-[12px] text-muted">
                  Kelas{' '}
                  <span className="font-semibold text-ink">
                    {penugasan.kelas?.nama ?? '–'}
                  </span>
                  <span aria-hidden="true"> · </span>
                  Pekan{' '}
                  <span className="tnum font-semibold text-ink">
                    {pertemuan.minggu_ke}
                  </span>
                </p>
              </div>
              <span className="grid size-6 shrink-0 place-items-center rounded-[4px] bg-brand-soft text-[11px] font-bold text-brand-strong">
                {penugasan.metode}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <LabelStatus status={pertemuan.status} />
            </div>
            {pertemuan.catatan ? (
              <p className="mt-2 text-[12px] text-muted">{pertemuan.catatan}</p>
            ) : null}
            <div className="mt-3 border-t border-line pt-3">
              <Button
                ukuran="sm"
                variasi="sekunder"
                onClick={() => onPilih(penugasan, pertemuan.minggu_ke)}
                ikon={<Pencil className="size-3.5" />}
              >
                Ubah status
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
