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
import { RekapTanggal } from '@/components/RekapTanggal'
import { DenganNomorUrut } from '@/components/NomorUrut'
import { STATUS_META } from '@/components/StatusPertemuan'
import { PertemuanDialog } from '@/components/PertemuanDialog'
import { useToast } from '@/components/ui/Toast'
import { useDosen, useKelas, useMataKuliah, usePeriode } from '@/hooks/useMasterData'
import { usePenugasanLengkap } from '@/hooks/useRekap'
import { usePengaturan } from '@/contexts/SettingsContext'
import {
  adaStatus,
  cocokBulan,
  daftarPertemuanTanggal,
  hitungRekap,
  rekapStatus,
  ringkasRekap,
  ringkasTanggal,
  STATUS_URUT,
  TOTAL_MINGGU,
  type FilterBulan,
  type HitungStatus,
  type StatusFilter,
} from '@/lib/attendance'
import {
  formatPersen,
  formatTanggalPanjang,
  NAMA_BULAN,
  namaMetode,
  tanggalHariIni,
} from '@/lib/format'
import type { PenugasanLengkap, RekapBaris, StatusPertemuan } from '@/lib/types'

const UKURAN_HALAMAN = 25
const KELAS_LINK_TOMBOL =
  'inline-flex h-10 items-center justify-center rounded-[6px] bg-brand px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-strong'

type Kolom = 'dosen' | 'persentase' | 'total'

export function DashboardPage() {
  const { data: periode = [] } = usePeriode()
  const { data: dosen = [] } = useDosen()
  const { data: mataKuliah = [] } = useMataKuliah()
  const { data: kelas = [] } = useKelas()
  const rekapQuery = usePenugasanLengkap()
  const { aturan } = usePengaturan()
  const { tampil } = useToast()

  const [periodeId, setPeriodeId] = useState('')
  const [bulan, setBulan] = useState<FilterBulan>('semua')
  const [tanggal, setTanggal] = useState<string>(tanggalHariIni)
  const [dosenId, setDosenId] = useState('semua')
  const [mkId, setMkId] = useState('semua')
  const [kelasId, setKelasId] = useState('semua')
  const [metode, setMetode] = useState<'semua' | 'T' | 'P'>('semua')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua')
  const [cari, setCari] = useState('')
  const [urut, setUrut] = useState<{ kolom: Kolom; arah: 'naik' | 'turun' }>({
    kolom: 'dosen',
    arah: 'naik',
  })
  const [halaman, setHalaman] = useState(1)
  const [dialog, setDialog] = useState<{
    baris: PenugasanLengkap
    minggu: number
  } | null>(null)
  const [eksporTerbuka, setEksporTerbuka] = useState(false)
  const [tampilan, setTampilan] = useState<'pekan' | 'tanggal'>('pekan')

  useEffect(() => {
    if (periodeId || periode.length === 0) return
    const aktif = periode.find((p) => p.aktif)
    setPeriodeId((aktif ?? periode[0]).id)
  }, [periode, periodeId])

  useEffect(() => {
    setHalaman(1)
  }, [
    periodeId,
    bulan,
    tanggal,
    dosenId,
    mkId,
    kelasId,
    metode,
    statusFilter,
    cari,
    tampilan,
  ])

  useEffect(() => {
    if (!eksporTerbuka) return
    function padaTombol(e: KeyboardEvent) {
      if (e.key === 'Escape') setEksporTerbuka(false)
    }
    window.addEventListener('keydown', padaTombol)
    return () => window.removeEventListener('keydown', padaTombol)
  }, [eksporTerbuka])

  // Penugasan yang lolos semua filter (dipakai untuk ringkasan status & tabel).
  const dasar = useMemo(() => {
    if (!rekapQuery.data) return []
    return rekapQuery.data.filter((p) => {
      if (periodeId && p.periode?.id !== periodeId) return false
      if (dosenId !== 'semua' && p.dosen?.id !== dosenId) return false
      if (mkId !== 'semua' && p.mata_kuliah?.id !== mkId) return false
      if (kelasId !== 'semua' && p.kelas?.id !== kelasId) return false
      if (metode !== 'semua' && p.metode !== metode) return false
      return true
    })
  }, [rekapQuery.data, periodeId, dosenId, mkId, kelasId, metode])

  // Semua pertemuan pada tanggal terpilih, sebelum filter status/pencarian.
  const barisTanggal = useMemo(
    () => daftarPertemuanTanggal(dasar, tanggal),
    [dasar, tanggal],
  )

  // Ringkasan jumlah tiap status (Hadir/Tidak hadir/Izin/Pengganti), mengikuti
  // filter aktif — dipakai sebagai chip filter yang bisa diklik.
  const statusRingkas = useMemo<HitungStatus>(() => {
    const total: HitungStatus = {
      hadir: 0,
      tidak_hadir: 0,
      izin: 0,
      pengganti: 0,
      belum: 0,
    }
    if (tampilan === 'tanggal') {
      for (const { pertemuan } of barisTanggal) total[pertemuan.status] += 1
      return total
    }
    for (const p of dasar) {
      const r = rekapStatus(p, bulan)
      total.hadir += r.hadir
      total.tidak_hadir += r.tidak_hadir
      total.izin += r.izin
      total.pengganti += r.pengganti
      total.belum += r.belum
    }
    return total
  }, [dasar, bulan, tampilan, barisTanggal])

  const baris = useMemo(() => {
    const hasil =
      statusFilter === 'semua'
        ? dasar
        : dasar.filter((p) => adaStatus(p, bulan, statusFilter))
    return hasil.map((p) => hitungRekap(p, bulan, aturan))
  }, [dasar, bulan, aturan, statusFilter])

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase()
    const hasil = q
      ? baris.filter(
          (b) =>
            b.dosen?.nama.toLowerCase().includes(q) ||
            b.mata_kuliah?.nama.toLowerCase().includes(q) ||
            b.mata_kuliah?.kode.toLowerCase().includes(q) ||
            b.kelas?.nama.toLowerCase().includes(q),
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

  const tersaringTanggal = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return barisTanggal
      .filter(({ penugasan, pertemuan }) => {
        if (statusFilter !== 'semua' && pertemuan.status !== statusFilter)
          return false
        if (!q) return true
        return (
          (penugasan.dosen?.nama ?? '').toLowerCase().includes(q) ||
          (penugasan.mata_kuliah?.nama ?? '').toLowerCase().includes(q) ||
          (penugasan.mata_kuliah?.kode ?? '').toLowerCase().includes(q) ||
          (penugasan.kelas?.nama ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const dosen = (a.penugasan.dosen?.nama ?? '').localeCompare(
          b.penugasan.dosen?.nama ?? '',
        )
        if (dosen !== 0) return dosen
        const mk = (a.penugasan.mata_kuliah?.nama ?? '').localeCompare(
          b.penugasan.mata_kuliah?.nama ?? '',
        )
        if (mk !== 0) return mk
        return a.pertemuan.minggu_ke - b.pertemuan.minggu_ke
      })
  }, [barisTanggal, statusFilter, cari])

  const ringkasan = useMemo(
    () => ringkasRekap(tersaring, aturan),
    [tersaring, aturan],
  )
  const ringkasanTanggal = useMemo(
    () => ringkasTanggal(tersaringTanggal, aturan.hitungIzinSebagaiHadir),
    [tersaringTanggal, aturan.hitungIzinSebagaiHadir],
  )
  const jumlahAktif =
    tampilan === 'tanggal' ? tersaringTanggal.length : tersaring.length
  const totalHalaman = Math.max(1, Math.ceil(jumlahAktif / UKURAN_HALAMAN))
  const halamanAman = Math.min(halaman, totalHalaman)
  const tampilBaris = tersaring.slice(
    (halamanAman - 1) * UKURAN_HALAMAN,
    halamanAman * UKURAN_HALAMAN,
  )
  const tampilBarisTanggal = tersaringTanggal.slice(
    (halamanAman - 1) * UKURAN_HALAMAN,
    halamanAman * UKURAN_HALAMAN,
  )

  const periodeTerpilih = periode.find((p) => p.id === periodeId)
  const bulanLabel = bulan === 'semua' ? 'Semua bulan' : NAMA_BULAN[bulan]
  const tanggalLabel = tanggal ? formatTanggalPanjang(tanggal) : 'semua tanggal'
  const hariIni = tanggalHariIni()
  const konteks = {
    periodeNama: periodeTerpilih?.nama ?? 'semua periode',
    bulanLabel,
  }

  const adaFilter =
    (tampilan === 'pekan' && bulan !== 'semua') ||
    (tampilan === 'tanggal' && tanggal !== hariIni) ||
    dosenId !== 'semua' ||
    mkId !== 'semua' ||
    kelasId !== 'semua' ||
    metode !== 'semua' ||
    statusFilter !== 'semua' ||
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
    setTanggal(tanggalHariIni())
    setDosenId('semua')
    setMkId('semua')
    setKelasId('semua')
    setMetode('semua')
    setStatusFilter('semua')
    setCari('')
  }

  async function jalankanEkspor(jenis: 'excel' | 'pdf') {
    setEksporTerbuka(false)
    if (!adaHasil) {
      tampil('Tidak ada data untuk diekspor.', 'info')
      return
    }
    try {
      const mod = await import('@/lib/export')
      if (tampilan === 'tanggal') {
        if (jenis === 'excel') {
          mod.eksporExcelTanggal(tersaringTanggal, tanggal, konteks)
        } else {
          mod.eksporPdfTanggal(tersaringTanggal, tanggal, konteks)
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
  const adaHasil = jumlahAktif > 0

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
                ['tanggal', 'Per tanggal'],
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
            {tampilan === 'tanggal'
              ? 'Daftar pertemuan pada tanggal terpilih; klik Ubah untuk mengoreksi.'
              : 'Status 16 pekan; klik sel untuk mengubah.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-12">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="f-periode">
              Tahun ajaran
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
            {tampilan === 'tanggal' ? (
              <>
                <label
                  className="mb-1 block text-[11px] font-semibold text-muted"
                  htmlFor="f-tanggal"
                >
                  Tanggal
                </label>
                <Input
                  id="f-tanggal"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                />
              </>
            ) : (
              <>
                <label
                  className="mb-1 block text-[11px] font-semibold text-muted"
                  htmlFor="f-bulan"
                >
                  Bulan
                </label>
                <Select
                  id="f-bulan"
                  value={bulan === 'semua' ? 'semua' : String(bulan)}
                  onChange={(e) =>
                    setBulan(
                      e.target.value === 'semua' ? 'semua' : Number(e.target.value),
                    )
                  }
                >
                  <option value="semua">Semua bulan</option>
                  {NAMA_BULAN.map((nama, i) => (
                    <option key={nama} value={i}>
                      {nama}
                    </option>
                  ))}
                </Select>
              </>
            )}
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
            <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="f-kelas">
              Kelas
            </label>
            <Select id="f-kelas" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
              <option value="semua">Semua kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
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
                  placeholder="Nama dosen, mata kuliah, atau kelas"
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
            {tampilan === 'tanggal'
              ? tanggal
                ? `Menampilkan pertemuan pada ${tanggalLabel}. Gunakan filter di atas untuk mempersempit daftar.`
                : 'Pilih tanggal untuk melihat pertemuan pada hari itu.'
              : bulan === 'semua'
                ? 'Menghitung seluruh pekan pada periode terpilih.'
                : `Hanya pekan bertanggal ${bulanLabel} yang ditampilkan dan dihitung.`}
          </span>
        </p>
      </section>

      <section aria-label="Ringkasan rekap" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tampilan === 'tanggal' ? (
          <>
            <RingkasanKartu
              label="Pertemuan"
              nilai={String(ringkasanTanggal.jumlahPertemuan)}
            />
            <RingkasanKartu label="Dosen" nilai={String(ringkasanTanggal.jumlahDosen)} />
            <RingkasanKartu
              label="Kehadiran"
              nilai={formatPersen(ringkasanTanggal.persentaseHadir)}
            />
            <RingkasanKartu
              label="Belum dicatat"
              nilai={String(ringkasanTanggal.belum)}
              perhatian={ringkasanTanggal.belum > 0}
            />
          </>
        ) : (
          <>
            <RingkasanKartu
              label="Penugasan"
              nilai={String(ringkasan.jumlahPenugasan)}
            />
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
          </>
        )}
      </section>

      <section
        aria-label="Filter status kehadiran"
        className="rounded-[10px] border border-line bg-surface p-3 sm:p-4"
      >
        <div className="mb-2.5 flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-wide text-muted uppercase">
            Kelompokkan status
          </span>
          <span className="text-[11px] text-muted">
            ·{' '}
            {tampilan === 'tanggal'
              ? tanggalLabel
              : bulan === 'semua'
                ? 'semua bulan'
                : NAMA_BULAN[bulan]}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip
            label="Semua"
            jumlah={
              tampilan === 'tanggal'
                ? ringkasanTanggal.jumlahPertemuan
                : ringkasan.jumlahPenugasan
            }
            aktif={statusFilter === 'semua'}
            onClick={() => setStatusFilter('semua')}
          />
          {STATUS_URUT.map((s) => {
            const meta = STATUS_META[s]
            return (
              <StatusChip
                key={s}
                label={meta.label}
                tanda={meta.tanda}
                jumlah={statusRingkas[s]}
                kelasTeks={meta.teks}
                kelasLatar={meta.latar}
                aktif={statusFilter === s}
                onClick={() =>
                  setStatusFilter((prev) => (prev === s ? 'semua' : s))
                }
              />
            )
          })}
        </div>
        {statusFilter !== 'semua' ? (
          <p className="mt-2.5 text-[11px] text-muted">
            Menampilkan{' '}
            {tampilan === 'tanggal' ? 'pertemuan' : 'penugasan yang memiliki minimal satu pertemuan'}{' '}
            berstatus{' '}
            <strong className="text-ink">{STATUS_META[statusFilter].label}</strong>{' '}
            {tampilan === 'tanggal' ? 'pada tanggal terpilih' : 'pada periode/bulan terpilih'}.
          </p>
        ) : null}
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
          judul={
            tampilan === 'tanggal' && !tanggal ? 'Pilih tanggal' : 'Tidak ada hasil'
          }
          pesan={
            tampilan === 'tanggal'
              ? !tanggal
                ? 'Tentukan tanggal untuk melihat daftar pertemuan pada hari tersebut.'
                : `Tidak ada pertemuan pada ${tanggalLabel} yang cocok dengan filter aktif.`
              : 'Tidak ada penugasan yang cocok dengan filter aktif.'
          }
          aksi={
            tampilan === 'tanggal' && !tanggal ? (
              <Button onClick={() => setTanggal(hariIni)}>Lihat hari ini</Button>
            ) : (
              <Button onClick={bersihkanFilter}>Reset filter</Button>
            )
          }
        />
      ) : (
        <>
          {tampilan === 'tanggal' ? (
            <RekapTanggal
              baris={tampilBarisTanggal}
              mulai={(halamanAman - 1) * UKURAN_HALAMAN}
              onPilih={(penugasan, minggu) =>
                setDialog({ baris: penugasan, minggu })
              }
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
                    <th scope="col" className="min-w-28 px-4 py-3 font-semibold">
                      Kelas
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
                  {tampilBaris.map((b, i) => (
                    <BarisTabel
                      key={b.id}
                      baris={b}
                      nomor={(halamanAman - 1) * UKURAN_HALAMAN + i + 1}
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
            {tampilBaris.map((b, i) => (
              <KartuRekap
                key={b.id}
                baris={b}
                nomor={(halamanAman - 1) * UKURAN_HALAMAN + i + 1}
                ambang={aturan.ambang}
                onPilih={(m) => setDialog({ baris: b, minggu: m })}
              />
            ))}
              </div>
            </>
          )}

          {totalHalaman > 1 ? (
            <nav
              aria-label="Navigasi halaman"
              className="flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="tnum text-[13px] text-muted">
                Menampilkan {(halamanAman - 1) * UKURAN_HALAMAN + 1}–
                {Math.min(halamanAman * UKURAN_HALAMAN, jumlahAktif)} dari{' '}
                {jumlahAktif} {tampilan === 'tanggal' ? 'pertemuan' : 'baris'} ·
                halaman {halamanAman} dari {totalHalaman}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  ukuran="sm"
                  onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                  disabled={halamanAman <= 1}
                  ikon={<ChevronLeft className="size-4" />}
                  aria-label="Halaman sebelumnya"
                >
                  Sebelumnya
                </Button>

                <div
                  role="group"
                  aria-label="Nomor halaman"
                  className="hidden items-center gap-1 sm:flex"
                >
                  {daftarHalaman(halamanAman, totalHalaman).map((n, i) =>
                    n === 'jeda' ? (
                      <span
                        key={`jeda-${i}`}
                        aria-hidden="true"
                        className="grid min-w-6 place-items-center text-[13px] text-muted"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setHalaman(n)}
                        aria-label={`Buka halaman ${n}`}
                        aria-current={n === halamanAman ? 'page' : undefined}
                        className={`tnum grid min-h-11 min-w-11 place-items-center rounded-[6px] border text-[13px] font-semibold transition-colors duration-150 sm:min-h-9 sm:min-w-9 ${
                          n === halamanAman
                            ? 'border-brand bg-brand text-on-brand'
                            : 'border-line-strong bg-surface text-ink hover:bg-surface-2'
                        }`}
                      >
                        {n}
                      </button>
                    ),
                  )}
                </div>

                <label className="flex items-center gap-1.5 text-[13px] text-muted">
                  <span className="hidden sm:inline">Ke halaman</span>
                  <Select
                    aria-label="Pilih halaman"
                    value={halamanAman}
                    onChange={(e) => setHalaman(Number(e.target.value))}
                    className="tnum w-20 sm:min-h-9"
                  >
                    {Array.from({ length: totalHalaman }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </Select>
                  <span className="hidden sm:inline">dari {totalHalaman}</span>
                </label>

                <Button
                  ukuran="sm"
                  onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                  disabled={halamanAman >= totalHalaman}
                  aria-label="Halaman berikutnya"
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

function StatusChip({
  label,
  jumlah,
  aktif,
  onClick,
  tanda,
  kelasTeks,
  kelasLatar,
}: {
  label: string
  jumlah: number
  aktif: boolean
  onClick: () => void
  tanda?: string
  kelasTeks?: string
  kelasLatar?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors duration-150 ${
        aktif
          ? 'border-ink bg-ink text-paper'
          : `border-line-strong bg-surface text-ink hover:bg-surface-2`
      }`}
    >
      {tanda ? (
        <span
          aria-hidden="true"
          className={`grid size-5 place-items-center rounded-full text-[11px] font-bold ${
            aktif ? 'bg-paper/20 text-paper' : `${kelasLatar} ${kelasTeks}`
          }`}
        >
          {tanda}
        </span>
      ) : null}
      {label}
      <span
        className={`tnum rounded-full px-1.5 text-[11px] font-bold ${
          aktif ? 'bg-paper/20 text-paper' : 'bg-surface-2 text-muted'
        }`}
      >
        {jumlah}
      </span>
    </button>
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

/**
 * Nomor halaman yang ditampilkan di footer: halaman pertama, sekitar halaman
 * aktif, dan halaman terakhir. Halaman yang dilewati ditandai "jeda".
 */
function daftarHalaman(aktif: number, total: number): Array<number | 'jeda'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const nomor = new Set<number>([
    1,
    total,
    aktif - 2,
    aktif - 1,
    aktif,
    aktif + 1,
    aktif + 2,
  ])
  if (aktif <= 3) {
    nomor.add(2)
    nomor.add(3)
    nomor.add(4)
  }
  if (aktif >= total - 2) {
    nomor.add(total - 1)
    nomor.add(total - 2)
    nomor.add(total - 3)
  }

  const urut = [...nomor]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b)

  const hasil: Array<number | 'jeda'> = []
  let sebelumnya: number | null = null
  for (const n of urut) {
    if (sebelumnya !== null && n - sebelumnya > 1) hasil.push('jeda')
    hasil.push(n)
    sebelumnya = n
  }
  return hasil
}

function BarisTabel({
  baris,
  nomor,
  bulan,
  ambang,
  onPilih,
}: {
  baris: RekapBaris
  nomor: number
  bulan: FilterBulan
  ambang: number
  onPilih: (minggu: number) => void
}) {
  const rendah = baris.persentase !== null && baris.persentase < ambang
  const peta = new Map(baris.pertemuan.map((p) => [p.minggu_ke, p]))

  return (
    <tr className="row-stripe border-t border-line align-middle">
      <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-left font-semibold">
        <DenganNomorUrut nomor={nomor}>
          <span className="min-w-0">
            <span className="block max-w-52 truncate">
              {baris.dosen?.nama ?? '–'}
            </span>
            {baris.dosen?.nidn ? (
              <span className="tnum block text-[11px] font-normal text-muted">
                {baris.dosen.nidn}
              </span>
            ) : null}
          </span>
        </DenganNomorUrut>
      </th>
      <td className="px-4 py-2.5">
        <span className="block max-w-56 truncate">{baris.mata_kuliah?.nama ?? '–'}</span>
        <span className="text-[11px] text-muted">{baris.mata_kuliah?.kode ?? ''}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className="block max-w-28 truncate text-ink">
          {baris.kelas?.nama ?? '–'}
        </span>
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
  nomor,
  ambang,
  onPilih,
}: {
  baris: RekapBaris
  nomor: number
  ambang: number
  onPilih: (minggu: number) => void
}) {
  const rendah = baris.persentase !== null && baris.persentase < ambang
  return (
    <article className="rounded-[10px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-ink">
            <DenganNomorUrut nomor={nomor}>
              <span className="min-w-0 truncate">
                {baris.dosen?.nama ?? '–'}
              </span>
            </DenganNomorUrut>
          </h3>
          <p className="truncate text-[13px] text-muted">
            {baris.mata_kuliah?.kode} · {baris.mata_kuliah?.nama}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted">
            <span className="grid size-5 place-items-center rounded-[4px] bg-brand-soft text-[10px] font-bold text-brand-strong">
              {baris.metode}
            </span>
            {namaMetode(baris.metode)}
            <span className="text-muted" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-muted">Kelas</span>
              <span className="font-bold text-ink">{baris.kelas?.nama ?? '–'}</span>
            </span>
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
