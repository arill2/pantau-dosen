import type { ReactNode } from 'react'
import { StateBlock, TableSkeleton } from './ui/Feedback'
import { Button } from './ui/Button'

export interface Kolom<T> {
  judul: string
  render: (row: T) => ReactNode
  className?: string
  utama?: boolean
  sembunyikanMobile?: boolean
}

interface Props<T> {
  query: {
    isLoading: boolean
    isError: boolean
    refetch: () => void
    data: T[] | undefined
  }
  kolom: Kolom<T>[]
  barisKunci: (row: T) => string
  saring: (row: T) => string
  kataKunci: string
  judulKosong: string
  pesanKosong: string
  aksiKosong?: ReactNode
  pesanKosongFilter?: string
  keterangan?: (row: T) => ReactNode
}

export function MasterTable<T>({
  query,
  kolom,
  barisKunci,
  saring,
  kataKunci,
  judulKosong,
  pesanKosong,
  aksiKosong,
  pesanKosongFilter = 'Tidak ada data yang cocok dengan pencarian.',
  keterangan,
}: Props<T>) {
  if (query.isLoading) return <TableSkeleton />

  if (query.isError) {
    return (
      <StateBlock
        ragam="galat"
        judul="Gagal memuat data"
        pesan="Data tidak dapat diambil. Periksa koneksi lalu coba lagi."
        aksi={<Button onClick={() => query.refetch()}>Coba lagi</Button>}
      />
    )
  }

  const semua = query.data ?? []
  if (semua.length === 0) {
    return (
      <StateBlock judul={judulKosong} pesan={pesanKosong} aksi={aksiKosong} />
    )
  }

  const q = kataKunci.trim().toLowerCase()
  const hasil = q ? semua.filter((row) => saring(row).toLowerCase().includes(q)) : semua
  if (hasil.length === 0) {
    return <StateBlock judul="Tidak ada hasil" pesan={pesanKosongFilter} />
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-[10px] border border-line bg-surface lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-2 text-left">
                {kolom.map((k) => (
                  <th
                    key={k.judul}
                    scope="col"
                    className={`px-4 py-3 font-semibold whitespace-nowrap ${k.className ?? ''}`}
                  >
                    {k.judul}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hasil.map((row) => (
                <tr key={barisKunci(row)} className="row-stripe border-t border-line">
                  {kolom.map((k) => (
                    <td
                      key={k.judul}
                      className={`px-4 py-3 align-middle ${k.className ?? ''}`}
                    >
                      {k.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {hasil.map((row) => (
          <article
            key={barisKunci(row)}
            className="rounded-[10px] border border-line bg-surface p-4"
          >
            <dl className="flex flex-col gap-2.5">
              {kolom
                .filter((k) => !k.sembunyikanMobile)
                .map((k) => (
                  <div
                    key={k.judul}
                    className={
                      k.utama
                        ? 'flex flex-col'
                        : 'flex items-baseline justify-between gap-3'
                    }
                  >
                    <dt
                      className={
                        k.utama
                          ? 'sr-only'
                          : 'text-[11px] font-semibold tracking-wide text-muted uppercase'
                      }
                    >
                      {k.judul}
                    </dt>
                    <dd
                      className={
                        k.utama
                          ? 'text-sm font-semibold text-ink'
                          : 'text-right text-[13px] text-ink'
                      }
                    >
                      {k.render(row)}
                    </dd>
                  </div>
                ))}
            </dl>
            {keterangan ? (
              <div className="mt-3 border-t border-line pt-3 text-[13px] text-muted">
                {keterangan(row)}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  )
}
