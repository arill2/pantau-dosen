import { Button } from '@/components/ui/Button'
import {
  hitungPerBulan,
  hitungRekap,
  type AturanHitung,
} from '@/lib/attendance'
import { BULAN_SINGKAT, formatPersen } from '@/lib/format'
import type { RekapBaris } from '@/lib/types'

interface Props {
  baris: RekapBaris[]
  bulanList: number[]
  aturan: AturanHitung
  onBukaPekan: () => void
}

export function RekapBulanan({ baris, bulanList, aturan, onBukaPekan }: Props) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[10px] border border-line bg-surface lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <caption className="sr-only">
              Persentase dan total kehadiran dosen per bulan
            </caption>
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-2 text-left">
                <th scope="col" className="sticky left-0 z-20 min-w-52 bg-surface-2 px-4 py-3 font-semibold">
                  Dosen
                </th>
                <th scope="col" className="min-w-52 px-4 py-3 font-semibold">
                  Mata kuliah
                </th>
                <th scope="col" className="min-w-28 px-4 py-3 font-semibold">
                  Kelas
                </th>
                <th scope="col" className="w-14 px-2 py-3 text-center font-semibold">
                  T/P
                </th>
                {bulanList.map((b) => (
                  <th key={b} scope="col" className="w-24 px-2 py-3 text-center font-semibold">
                    {BULAN_SINGKAT[b]}
                  </th>
                ))}
                <th scope="col" className="w-24 px-3 py-3 text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {baris.map((item) => {
                const perBulan = hitungPerBulan(item, bulanList, aturan)
                const total = hitungRekap(item, 'semua', aturan)
                const totalRendah =
                  total.persentase !== null && total.persentase < aturan.ambang
                return (
                  <tr key={item.id} className="row-stripe border-t border-line">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-left font-semibold"
                    >
                      <span className="block max-w-52 truncate">
                        {item.dosen?.nama ?? '–'}
                      </span>
                      {item.dosen?.nidn ? (
                        <span className="tnum block text-[11px] font-normal text-muted">
                          {item.dosen.nidn}
                        </span>
                      ) : null}
                    </th>
                    <td className="px-4 py-2.5">
                      <span className="block max-w-52 truncate">
                        {item.mata_kuliah?.nama ?? '–'}
                      </span>
                      <span className="text-[11px] text-muted">
                        {item.mata_kuliah?.kode ?? ''}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="block max-w-28 truncate text-ink">
                        {item.kelas?.nama ?? '–'}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="inline-grid size-6 place-items-center rounded-[4px] bg-brand-soft text-[11px] font-bold text-brand-strong">
                        {item.metode}
                      </span>
                    </td>
                    {perBulan.map((r) => {
                      const rendah =
                        r.persentase !== null && r.persentase < aturan.ambang
                      return (
                        <td key={r.bulan} className="px-2 py-2.5 text-center">
                          {r.adaData ? (
                            <span className="flex flex-col leading-tight">
                              <span
                                className={`tnum text-[13px] font-bold ${
                                  rendah ? 'text-alfa' : 'text-ink'
                                }`}
                              >
                                {formatPersen(r.persentase)}
                              </span>
                              <span className="tnum text-[11px] text-muted">
                                {r.totalHadir}/{r.totalDihitung}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted">–</span>
                          )}
                        </td>
                      )
                    })}
                    <td
                      className={`tnum px-3 py-2.5 text-right font-bold ${
                        totalRendah ? 'text-alfa' : 'text-ink'
                      }`}
                    >
                      <span className="flex flex-col leading-tight">
                        <span>{formatPersen(total.persentase)}</span>
                        <span className="text-[11px] font-normal text-muted">
                          {total.totalHadir}/{total.totalDihitung}
                        </span>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {baris.map((item) => {
          const perBulan = hitungPerBulan(item, bulanList, aturan)
          const total = hitungRekap(item, 'semua', aturan)
          return (
            <article
              key={item.id}
              className="rounded-[10px] border border-line bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-ink">
                    {item.dosen?.nama ?? '–'}
                  </h3>
                  <p className="truncate text-[13px] text-muted">
                    {item.mata_kuliah?.kode} · {item.mata_kuliah?.nama}
                  </p>
                  <p className="text-[12px] text-muted">
                    Kelas <span className="font-semibold text-ink">{item.kelas?.nama ?? '–'}</span>
                  </p>
                </div>
                <span className="grid size-6 shrink-0 place-items-center rounded-[4px] bg-brand-soft text-[11px] font-bold text-brand-strong">
                  {item.metode}
                </span>
              </div>
              <dl className="mt-3 flex flex-col divide-y divide-[var(--line)] border-t border-line">
                {perBulan.map((r) => (
                  <div
                    key={r.bulan}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <dt className="text-[13px] text-ink">
                      {BULAN_SINGKAT[r.bulan]}{' '}
                      <span className="text-muted">
                        {r.adaData ? `(${r.totalHadir}/${r.totalDihitung})` : ''}
                      </span>
                    </dt>
                    <dd
                      className={`tnum text-[13px] font-bold ${
                        r.persentase !== null && r.persentase < aturan.ambang
                          ? 'text-alfa'
                          : 'text-ink'
                      }`}
                    >
                      {r.adaData ? formatPersen(r.persentase) : '–'}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
                <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                  Total keseluruhan
                </span>
                <span className="tnum text-[13px] font-bold text-ink">
                  {formatPersen(total.persentase)}{' '}
                  <span className="font-normal text-muted">
                    ({total.totalHadir}/{total.totalDihitung})
                  </span>
                </span>
              </div>
            </article>
          )
        })}
        <Button variasi="sekunder" onClick={onBukaPekan}>
          Buka tampilan Per pekan untuk mengubah status
        </Button>
      </div>
    </>
  )
}
