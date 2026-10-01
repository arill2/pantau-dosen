import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { StateBlock, TableSkeleton } from '@/components/ui/Feedback'
import { MiniTrack, WeekStrip } from '@/components/WeekStrip'
import { RekapBulanan } from '@/components/RekapBulanan'
import { STATUS_META } from '@/components/StatusPertemuan'
import { PertemuanDialog } from '@/components/PertemuanDialog'
import { useToast } from '@/components/ui/Toast'
import { useDosen, useMataKuliah, usePeriode } from '@/hooks/useMasterData'
import { usePenugasanLengkap } from '@/hooks/useRekap'
import { usePengaturan } from '@/contexts/SettingsContext'
import {
  cocokBulan,
  daftarBulanAktif,
  hitungRekap,
  ringkasRekap,
  TOTAL_MINGGU,
  type FilterBulan,
} from '@/lib/attendance'
import { formatPersen, NAMA_BULAN, namaMetode } from '@/lib/format'
import type { RekapBaris, StatusPertemuan } from '@/lib/types'

const UKURAN_HALAMAN = 25
const KELAS_LINK_TOMBOL =
  'inline-flex h-10 items-center justify-center rounded-[6px] bg-brand px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-strong'

type Kolom = 'dosen' | 'persentase' | 'total'

export function DashboardPage() {
  const { data: periode = [] } = usePeriode()
  const { data: dosen = [] } = useDosen()
  const { data: mataKuliah = [] } = useMataKuliah()
  const rekapQuery = usePenugasanLengkap()
  const { aturan } = usePengaturan()
  const { tampil } = useToast()

  const [periodeId, setPeriodeId] = useState('')
  const [bulan, setBulan] = useState<FilterBulan>('semua')
  const [dosenId, setDosenId] = useState('semua')
  const [mkId, setMkId] = useState('semua')
  const [metode, setMetode] = useState<'semua' | 'T' | 'P'>('semua')
  const [cari, setCari] = useState('')
  const [urut, setUrut] = useState<{ kolom: Kolom; arah: 'naik' | 'turun' }>({
    kolom: 'dosen',
    arah: 'naik',
  })
  const [halaman, setHalaman] = useState(1)
  const [dialog, setDialog] = useState<{ baris: RekapBaris; minggu: number } | null>(
    null,
  )
  const [eksporTerbuka, setEksporTerbuka] = useState(false)
  const [tampilan, setTampilan] = useState<'pekan' | 'bulan'>('pekan')

  // Mode "Per bulan" menampilkan semua bulan sekaligus, jadi filter bulan
  // tidak berlaku (dihitung sebagai semua bulan).
  const bulanEfektif: FilterBulan = tampilan === 'bulan' ? 'semua' : bulan

  useEffect(() => {
    if (periodeId || periode.length === 0) return
    const aktif = periode.find((p) => p.aktif)
    setPeriodeId((aktif ?? periode[0]).id)
  }, [periode, periodeId])

  useEffect(() => {
    setHalaman(1)
  }, [periodeId, bulan, dosenId, mkId, metode, cari, tampilan])

  useEffect(() => {
    if (!eksporTerbuka) return
    function padaTombol(e: KeyboardEvent) {
      if (e.key === 'Escape') setEksporTerbuka(false)
    }
    window.addEventListener('keydown', padaTombol)
    return () => window.removeEventListener('keydown', padaTombol)
  }, [eksporTerbuka])

  const baris = useMemo(() => {
    if (!rekapQuery.data) return []
    const dasar = rekapQuery.data.filter((p) => {
      if (periodeId && p.periode?.id !== periodeId) return false
      if (dosenId !== 'semua' && p.dosen?.id !== dosenId) return false
      if (mkId !== 'semua' && p.mata_kuliah?.id !== mkId) return false
      if (metode !== 'semua' && p.metode !== metode) return false
      return true
    })
    return dasar.map((p) => hitungRekap(p, bulanEfektif, aturan))
  }, [rekapQuery.data, periodeId, dosenId, mkId, metode, bulanEfektif, aturan])

  const bulanList = useMemo(() => daftarBulanAktif(baris), [baris])

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase()
    const hasil = q
      ? baris.filter(
          (b) =>
            b.dosen?.nama.toLowerCase().includes(q) ||
            b.mata_kuliah?.nama.toLowerCase().includes(q) ||
            b.mata_kuliah?.kode.toLowerCase().includes(q),
        )
      : baris

    const arah = urut.arah === 'naik' ? 1 : -1
    return [...hasil].sort((a, b) => {
      if (urut.kolom === 'dosen')
        return (a.dosen?.nama ?? '').localeCompare(b.dosen?.nama ?? '') * arah
      if (urut.kolom === 'total') return (a.totalHadir - b.totalHadir) * arah
      return ((a.persentase ?? -1) - (b.persentase ?? -1)) * arah
    })
  }, [baris, cari, urut])

  const ringkasan = useMemo(
    () => ringkasRekap(tersaring, aturan),
    [tersaring, aturan],
  )
  const totalHalaman = Math.max(1, Math.ceil(tersaring.length / UKURAN_HALAMAN))
  const halamanAman = Math.min(halaman, totalHalaman)
  const tampilBaris = tersaring.slice(
    (halamanAman - 1) * UKURAN_HALAMAN,
    halamanAman * UKURAN_HALAMAN,
  )

  const periodeTerpilih = periode.find((p) => p.id === periodeId)
  const bulanLabel = bulan === 'semua' ? 'Semua bulan' : NAMA_BULAN[bulan]
  const konteks = {
    periodeNama: periodeTerpilih?.nama ?? 'semua periode',
    bulanLabel,
  }

  const adaFilter =
    bulan !== 'semua' ||
    dosenId !== 'semua' ||
    mkId !== 'semua' ||
    metode !== 'semua' ||
    cari.trim() !== ''

  function aturUrut(kolom: Kolom) {
    setUrut((prev) =>
      prev.kolom === kolom
        ? { kolom, arah: prev.arah === 'naik' ? 'turun' : 'naik' }
        : { kolom, arah: 'naik' },
    )
  }

  function bersihkanFilter() {
    setBulan('semua')
    setDosenId('semua')
    setMkId('semua')
    setMetode('semua')
    setCari('')
  }

  async function jalankanEkspor(jenis: 'excel' | 'pdf') {
    setEksporTerbuka(false)
    if (tersaring.length === 0) {
      tampil('Tidak ada data untuk diekspor.', 'info')
      return
    }
    try {
      const mod = await import('@/lib/export')
      if (tampilan === 'bulan') {
        if (jenis === 'excel') {
          mod.eksporExcelBulanan(tersaring, bulanList, konteks, aturan)
        } else {
          mod.eksporPdfBulanan(
            tersaring,
            bulanList,
            konteks,
            aturan,
            ringkasan.rataPersentase,
          )
        }
      } else if (jenis === 'excel') {
        mod.eksporExcel(tersaring, bulan, konteks)
      } else {
        mod.eksporPdf(tersaring, bulan, konteks, ringkasan.rataPersentase)
      }
      tampil(
        `${jenis === 'excel' ? 'Excel' : 'PDF'} sedang diunduh.`,
        'sukses',
      )
    } catch {
      tampil('Ekspor gagal. Coba lagi.', 'galat')
    }
  }

  const belumAdaData = (rekapQuery.data?.length ?? 0) === 0
  const adaHasil = tersaring.length > 0

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label="Filter rekap"
        className="rounded-[10px] border border-line bg-surface p-3 sm:p-4"
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Tampilan rekap"
            className="inline-flex w-full rounded-[6px] border border-line-strong bg-surface-2 p-0.5 sm:w-auto"
          >
            {(
              [
                ['pekan', 'Per pekan'],
                ['bulan', 'Per bulan'],
              ] as const
            ).map(([nilai, label]) => (
              <button
                key={nilai}
                type="button"
                onClick={() => setTampilan(nilai)}
                aria-pressed={tampilan === nilai}
                className={`min-h-11 flex-1 rounded-[4px] px-3 text-[13px] font-semibold transition-colors duration-150 sm:min-h-8 sm:flex-none ${
                  tampilan === nilai
                    ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted">
            {tampilan === 'bulan'
              ? 'Persentase & total tiap bulan dalam satu tabel.'
              : 'Status 16 pekan; klik sel untuk mengubah.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-4">
            <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="f-periode">
              Periode
            </label>
            <Select id="f-periode" value={periodeId} onChange={(e) => setPeriodeId(e.target.value)}>
              {periode.length === 0 ? <option value="">Belum ada periode</option> : null}
              {periode.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                  {p.aktif ? ' (aktif)' : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="f-bulan">
              Bulan
            </label>
            <Select
              id="f-bulan"
              value={bulan === 'semua' ? 'semua' : String(bulan)}
              disabled={tampilan === 'bulan'}
              className="disabled:cursor-not-allowed disabled:opacity-55"
              onChange={(e) =>
                setBulan(e.target.value === 'semua' ? 'semua' : Number(e.target.value))
              }
            >
              <option value="semua">Semua bulan</option>
              {NAMA_BULAN.map((nama, i) => (
                <option key={nama} value={i}>
                  {nama}
                </option>
              ))}
            </Select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="f-dosen">
              Dosen
            </label>
            <Select id="f-dosen" value={dosenId} onChange={(e) => setDosenId(e.target.value)}>
              <option value="semua">Semua dosen</option>
              {dosen.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama}
                </option>
              ))}
            </Select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="f-mk">
              Mata kuliah
            </label>
            <Select id="f-mk" value={mkId} onChange={(e) => setMkId(e.target.value)}>
              <option value="semua">Semua mata kuliah</option>
              {mataKuliah.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.kode} · {m.nama}
                </option>
              ))}
            </Select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="f-metode">
              Metode
            </label>
            <Select
              id="f-metode"
              value={metode}
              onChange={(e) => setMetode(e.target.value as 'semua' | 'T' | 'P')}
            >
              <option value="semua">Teori &amp; praktik</option>
              <option value="T">Teori</option>
              <option value="P">Praktik</option>
            </Select>
          </div>

          <div className="col-span-2 lg:col-span-12">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="f-cari">
                  Cari
                </label>
                <Input
                  id="f-cari"
                  type="search"
                  value={cari}
                  onChange={(e) => setCari(e.target.value)}
                  placeholder="Nama dosen atau mata kuliah"
                />
              </div>
              <div className="flex items-center gap-2">
                {adaFilter ? (
                  <Button variasi="halus" onClick={bersihkanFilter} ikon={<X className="size-4" />}>
                    Reset
                  </Button>
                ) : null}
                <div className="relative">
                  <Button
                    variasi="utama"
                    onClick={() => setEksporTerbuka((v) => !v)}
                    ikon={<Download className="size-4" />}
                    aria-haspopup="menu"
                    aria-expanded={eksporTerbuka}
                    className="w-full sm:w-auto"
                  >
                    Ekspor
                  </Button>
                  {eksporTerbuka ? (
                    <>
                      <button
                        type="button"
                        aria-label="Tutup menu ekspor"
                        onClick={() => setEksporTerbuka(false)}
                        className="fixed inset-0 z-10 cursor-default"
                      />
                      <div
                        role="menu"
                        className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-[10px] border border-line bg-surface py-1 shadow-[0_14px_34px_-16px_color-mix(in_srgb,var(--ink)_45%,transparent)]"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void jalankanEkspor('excel')}
                          className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-surface-2"
                        >
                          <FileSpreadsheet className="size-4 text-hadir" aria-hidden="true" />
                          Unduh Excel (.xlsx)
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void jalankanEkspor('pdf')}
                          className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-surface-2"
                        >
                          <FileText className="size-4 text-alfa" aria-hidden="true" />
                          Unduh PDF (landscape)
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted">
          <SlidersHorizontal className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {tampilan === 'bulan'
              ? bulanList.length > 0
                ? `Persentase & total per bulan untuk ${bulanList.length} bulan yang memiliki pertemuan.`
                : 'Belum ada pertemuan bertanggal untuk dihitung per bulan.'
              : bulan === 'semua'
                ? 'Menghitung seluruh pekan pada periode terpilih.'
                : `Hanya pekan bertanggal ${bulanLabel} yang ditampilkan dan dihitung.`}
          </span>
        </p>
      </section>

      <section aria-label="Ringkasan rekap" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <RingkasanKartu label="Penugasan" nilai={String(ringkasan.jumlahPenugasan)} />
        <RingkasanKartu label="Dosen" nilai={String(ringkasan.jumlahDosen)} />
        <RingkasanKartu
          label="Rata-rata kehadiran"
          nilai={formatPersen(ringkasan.rataPersentase)}
        />
        <RingkasanKartu
          label={`Di bawah ${aturan.ambang}%`}
          nilai={String(ringkasan.diBawahAmbang)}
          perhatian={ringkasan.diBawahAmbang > 0}
        />
      </section>

      {rekapQuery.isLoading ? (
        <TableSkeleton />
      ) : rekapQuery.isError ? (
        <StateBlock
          ragam="galat"
          judul="Gagal memuat rekap"
          pesan="Data tidak dapat diambil. Periksa koneksi lalu coba lagi."
          aksi={<Button onClick={() => void rekapQuery.refetch()}>Coba lagi</Button>}
        />
      ) : belumAdaData ? (
        <StateBlock
          judul="Belum ada penugasan"
          pesan="Rekap muncul setelah Anda mengisi periode, dosen, mata kuliah, lalu menugaskannya."
          aksi={
            <Link to="/penugasan" className={KELAS_LINK_TOMBOL}>
              Buka halaman Penugasan
            </Link>
          }
        />
      ) : !adaHasil ? (
        <StateBlock
          judul="Tidak ada hasil"
          pesan="Tidak ada penugasan yang cocok dengan filter aktif."
          aksi={<Button onClick={bersihkanFilter}>Reset filter</Button>}
        />
      ) : (
        <>
          {tampilan === 'bulan' ? (
            <RekapBulanan
              baris={tampilBaris}
              bulanList={bulanList}
              aturan={aturan}
              onBukaPekan={() => setTampilan('pekan')}
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-[10px] border border-line bg-surface lg:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <caption className="sr-only">
                  Rekap kehadiran dosen per pekan, {konteks.periodeNama}, {bulanLabel}
                </caption>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-surface-2 text-left">
                    <th scope="col" className="sticky left-0 z-20 min-w-52 bg-surface-2 px-4 py-3 font-semibold">
                      <TombolUrut
                        label="Dosen"
                        aktif={urut.kolom === 'dosen'}
                        onClick={() => aturUrut('dosen')}
                      />
                    </th>
                    <th scope="col" className="min-w-56 px-4 py-3 font-semibold">
                      Mata kuliah
                    </th>
                    <th scope="col" className="w-16 px-2 py-3 text-center font-semibold">
                      T/P
                    </th>
                    {Array.from({ length: TOTAL_MINGGU }, (_, i) => (
                      <th key={i} scope="col" className="w-11 px-1 py-3 text-center font-semibold">
                        {i + 1}
                      </th>
                    ))}
                    <th scope="col" className="w-24 px-3 py-3 text-right font-semibold">
                      <TombolUrut
                        label="% Hadir"
                        aktif={urut.kolom === 'persentase'}
                        onClick={() => aturUrut('persentase')}
                        ratakan
                      />
                    </th>
                    <th scope="col" className="w-16 px-3 py-3 text-right font-semibold">
                      <TombolUrut
                        label="Total"
                        aktif={urut.kolom === 'total'}
                        onClick={() => aturUrut('total')}
                        ratakan
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tampilBaris.map((b) => (
                    <BarisTabel
                      key={b.id}
                      baris={b}
                      bulan={bulan}
                      ambang={aturan.ambang}
                      onPilih={(m) => setDialog({ baris: b, minggu: m })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:hidden">
            {tampilBaris.map((b) => (
              <KartuRekap
                key={b.id}
                baris={b}
                ambang={aturan.ambang}
                onPilih={(m) => setDialog({ baris: b, minggu: m })}
              />
            ))}
              </div>
            </>
          )}

          {totalHalaman > 1 ? (
            <nav aria-label="Navigasi halaman" className="flex items-center justify-between gap-3">
              <p className="tnum text-[13px] text-muted">
                {tersaring.length} baris · halaman {halamanAman} dari {totalHalaman}
              </p>
              <div className="flex gap-2">
                <Button
                  ukuran="sm"
                  onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                  disabled={halamanAman <= 1}
                  ikon={<ChevronLeft className="size-4" />}
                >
                  Sebelumnya
                </Button>
                <Button
                  ukuran="sm"
                  onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                  disabled={halamanAman >= totalHalaman}
                >
                  Berikutnya
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      )}

      <PertemuanDialog
        terbuka={dialog !== null}
        baris={dialog?.baris ?? null}
        minggu={dialog?.minggu ?? null}
        onTutup={() => setDialog(null)}
      />
    </div>
  )
}

function RingkasanKartu({
  label,
  nilai,
  perhatian,
}: {
  label: string
  nilai: string
  perhatian?: boolean
}) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
      <p
        className={`tnum mt-1 text-2xl font-extrabold ${
          perhatian ? 'text-alfa' : 'text-ink'
        }`}
      >
        {nilai}
      </p>
    </div>
  )
}

function TombolUrut({
  label,
  aktif,
  onClick,
  ratakan,
}: {
  label: string
  aktif: boolean
  onClick: () => void
  ratakan?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-semibold transition-colors hover:text-brand-strong ${
        ratakan ? 'w-full justify-end' : ''
      } ${aktif ? 'text-brand-strong' : ''}`}
      aria-label={`Urutkan menurut ${label}`}
    >
      {label}
      <ArrowDownUp className="size-3.5" aria-hidden="true" />
    </button>
  )
}

function BarisTabel({
  baris,
  bulan,
  ambang,
  onPilih,
}: {
  baris: RekapBaris
  bulan: FilterBulan
  ambang: number
  onPilih: (minggu: number) => void
}) {
  const rendah = baris.persentase !== null && baris.persentase < ambang
  const peta = new Map(baris.pertemuan.map((p) => [p.minggu_ke, p]))

  return (
    <tr className="row-stripe border-t border-line align-middle">
      <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-left font-semibold">
        <span className="block max-w-52 truncate">{baris.dosen?.nama ?? '–'}</span>
        {baris.dosen?.nidn ? (
          <span className="tnum block text-[11px] font-normal text-muted">
            {baris.dosen.nidn}
          </span>
        ) : null}
      </th>
      <td className="px-4 py-2.5">
        <span className="block max-w-56 truncate">{baris.mata_kuliah?.nama ?? '–'}</span>
        <span className="text-[11px] text-muted">{baris.mata_kuliah?.kode ?? ''}</span>
      </td>
      <td className="px-2 py-2.5 text-center">
        <span className="inline-grid size-6 place-items-center rounded-[4px] bg-brand-soft text-[11px] font-bold text-brand-strong">
          {baris.metode}
        </span>
      </td>
      {Array.from({ length: TOTAL_MINGGU }, (_, i) => i + 1).map((m) => {
        const p = peta.get(m)
        const dalamBulan = p ? cocokBulan(p, bulan) : bulan === 'semua'
        return (
          <SelPekan
            key={m}
            minggu={m}
            status={p?.status ?? 'belum'}
            tanggal={p?.tanggal ?? null}
            nonaktif={!dalamBulan}
            onPilih={() => onPilih(m)}
          />
        )
      })}
      <td className={`tnum px-3 py-2.5 text-right font-bold ${rendah ? 'text-alfa' : 'text-ink'}`}>
        {formatPersen(baris.persentase)}
        {rendah ? (
          <span
            className="ml-1 align-middle text-[10px] font-bold"
            title={`Di bawah ${ambang}%`}
          >
            ▼
          </span>
        ) : null}
      </td>
      <td className="tnum px-3 py-2.5 text-right font-semibold">
        {baris.totalHadir}
        <span className="text-muted">/{baris.totalDihitung}</span>
      </td>
    </tr>
  )
}

function SelPekan({
  minggu,
  status,
  tanggal,
  nonaktif,
  onPilih,
}: {
  minggu: number
  status: StatusPertemuan
  tanggal: string | null
  nonaktif: boolean
  onPilih: () => void
}) {
  const meta = STATUS_META[status]
  return (
    <td className="px-0.5 py-2.5 text-center">
      <button
        type="button"
        onClick={onPilih}
        aria-label={`Pekan ${minggu}, ${meta.label}${tanggal ? `, ${tanggal}` : ''}`}
        className={`mx-auto grid size-8 place-items-center rounded-[6px] border border-transparent text-[12px] font-bold transition-colors duration-150 ${meta.latar} ${meta.teks} ${
          nonaktif ? 'opacity-35' : 'hover:border-brand'
        }`}
      >
        <span aria-hidden="true">{meta.tanda}</span>
      </button>
    </td>
  )
}

function KartuRekap({
  baris,
  ambang,
  onPilih,
}: {
  baris: RekapBaris
  ambang: number
  onPilih: (minggu: number) => void
}) {
  const rendah = baris.persentase !== null && baris.persentase < ambang
  return (
    <article className="rounded-[10px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-ink">{baris.dosen?.nama ?? '–'}</h3>
          <p className="truncate text-[13px] text-muted">
            {baris.mata_kuliah?.kode} · {baris.mata_kuliah?.nama}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <span className="grid size-5 place-items-center rounded-[4px] bg-brand-soft text-[10px] font-bold text-brand-strong">
              {baris.metode}
            </span>
            {namaMetode(baris.metode)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`tnum text-xl font-extrabold ${rendah ? 'text-alfa' : 'text-ink'}`}>
            {formatPersen(baris.persentase)}
          </p>
          <p className="tnum text-[11px] text-muted">
            {baris.totalHadir}/{baris.totalDihitung} hadir
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
        <MiniTrack pertemuan={baris.pertemuan} />
        <WeekStrip pertemuan={baris.pertemuan} onPilih={onPilih} />
      </div>
    </article>
  )
}
