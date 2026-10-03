import { useMemo, useState } from 'react'
import { Check, ExternalLink, Eye, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { StateBlock, TableSkeleton, InlineError } from '@/components/ui/Feedback'
import { Toolbar } from '@/components/Toolbar'
import { UbahLaporanDialog } from '@/components/UbahLaporanDialog'
import { useToast } from '@/components/ui/Toast'
import { useKelas } from '@/hooks/useMasterData'
import {
  useLaporan,
  useTerapkanLaporan,
  useTolakLaporan,
} from '@/lib/laporan'
import { formatTanggal, namaMetode } from '@/lib/format'
import { pesanError } from '@/lib/api'
import type { Laporan, StatusLaporan } from '@/lib/types'

const STATUS_LABEL: Record<StatusLaporan, string> = {
  baru: 'Baru',
  terverifikasi: 'Terverifikasi',
  ditolak: 'Ditolak',
}

const LAPORAN_KOSONG: Laporan[] = []

function StatusPill({ status }: { status: StatusLaporan }) {
  const kelas =
    status === 'terverifikasi'
      ? 'bg-hadir-soft text-hadir'
      : status === 'ditolak'
        ? 'bg-alfa-soft text-alfa'
        : 'bg-izin-soft text-izin'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${kelas}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

function HadirPill({ hadir }: { hadir: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
        hadir ? 'bg-hadir-soft text-hadir' : 'bg-alfa-soft text-alfa'
      }`}
    >
      <span aria-hidden="true">{hadir ? '✓' : '✕'}</span>
      {hadir ? 'Dosen hadir' : 'Tidak hadir'}
    </span>
  )
}

export function LaporanPage() {
  const query = useLaporan()
  const { data: kelas = [] } = useKelas()
  const terapkan = useTerapkanLaporan()
  const tolak = useTolakLaporan()
  const { tampil } = useToast()

  const [kelasId, setKelasId] = useState('semua')
  const [status, setStatus] = useState<'semua' | StatusLaporan>('baru')
  const [cari, setCari] = useState('')
  const [detail, setDetail] = useState<Laporan | null>(null)
  const [edit, setEdit] = useState<Laporan | null>(null)
  const [akanTolak, setAkanTolak] = useState<Laporan | null>(null)
  const [alasan, setAlasan] = useState('')
  const [galat, setGalat] = useState<string | null>(null)

  const semua = query.data ?? LAPORAN_KOSONG
  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return semua.filter((l) => {
      if (kelasId !== 'semua' && l.kelas_id !== kelasId) return false
      if (status !== 'semua' && l.status !== status) return false
      if (
        q &&
        !`${l.nama_ketua} ${l.mata_kuliah ?? ''} ${l.nama_dosen ?? ''} ${
          l.kelas?.nama ?? ''
        }`
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
  }, [semua, kelasId, status, cari])

  const ringkas = useMemo(
    () => ({
      total: semua.length,
      baru: semua.filter((l) => l.status === 'baru').length,
      hadir: semua.filter((l) => l.dosen_hadir).length,
      tidak: semua.filter((l) => !l.dosen_hadir).length,
    }),
    [semua],
  )

  async function terapkanKeRekap(l: Laporan) {
    setGalat(null)
    try {
      await terapkan.mutateAsync(l)
      tampil('Laporan diterima dan masuk ke rekap.', 'sukses')
      setDetail(null)
    } catch (err) {
      const pesan = pesanError(err)
      setGalat(pesan)
      tampil(pesan, 'galat')
    }
  }

  async function konfirmasiTolak() {
    if (!akanTolak) return
    setGalat(null)
    try {
      await tolak.mutateAsync({ id: akanTolak.id, alasan })
      tampil('Laporan ditolak.', 'sukses')
      setAkanTolak(null)
      setAlasan('')
      setDetail(null)
    } catch (err) {
      setGalat(pesanError(err))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Ringkasan laporan" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kartu label="Total laporan" nilai={ringkas.total} />
        <Kartu label="Perlu ditinjau" nilai={ringkas.baru} perhatian={ringkas.baru > 0} />
        <Kartu label="Dosen hadir" nilai={ringkas.hadir} />
        <Kartu label="Dosen tidak hadir" nilai={ringkas.tidak} perhatian={ringkas.tidak > 0} />
      </section>

      <Toolbar
        cari={cari}
        setCari={setCari}
        placeholder="Cari ketua, dosen, mata kuliah"
        jumlah={tersaring.length}
        labelJumlah="laporan"
      >
        <div className="flex w-full gap-2 sm:w-auto">
          <Select
            aria-label="Filter kelas"
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
          >
            <option value="semua">Semua kelas</option>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'semua' | StatusLaporan)}
          >
            <option value="semua">Semua status</option>
            <option value="baru">Baru</option>
            <option value="terverifikasi">Terverifikasi</option>
            <option value="ditolak">Ditolak</option>
          </Select>
        </div>
      </Toolbar>

      {ringkas.baru > 0 ? (
        <div className="flex items-start gap-2.5 rounded-[10px] border border-izin bg-izin-soft px-4 py-3 text-[13px]">
          <span aria-hidden="true" className="text-izin">⚠</span>
          <p className="text-ink">
            <strong>{ringkas.baru} laporan</strong> menunggu verifikasi. Data ini{' '}
            <strong>belum masuk rekap</strong> sampai Anda menerimanya.
          </p>
        </div>
      ) : null}

      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <StateBlock
          ragam="galat"
          judul="Gagal memuat laporan"
          pesan="Data laporan tidak dapat diambil."
          aksi={<Button onClick={() => void query.refetch()}>Coba lagi</Button>}
        />
      ) : semua.length === 0 ? (
        <StateBlock
          judul="Belum ada laporan"
          pesan="Laporan dari ketua kelas akan muncul di sini untuk diverifikasi."
        />
      ) : tersaring.length === 0 ? (
        <StateBlock judul="Tidak ada hasil" pesan="Tidak ada laporan yang cocok dengan filter." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[10px] border border-line bg-surface lg:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-surface-2 text-left">
                    {['Waktu lapor', 'Ketua kelas', 'Kelas', 'Mata kuliah', 'Dosen', 'Pekan', 'Tanggal', 'Status dosen', 'Status', 'Aksi'].map(
                      (h) => (
                        <th key={h} scope="col" className="px-3 py-3 font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tersaring.map((l) => (
                    <tr key={l.id} className="row-stripe border-t border-line">
                      <td className="tnum px-3 py-2.5 whitespace-nowrap text-muted">
                        {new Date(l.dibuat_pada).toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-ink">{l.nama_ketua}</td>
                      <td className="px-3 py-2.5 text-ink">{l.kelas?.nama ?? '–'}</td>
                      <td className="px-3 py-2.5">
                        <span className="block max-w-48 truncate text-ink">{l.mata_kuliah ?? '–'}</span>
                        <span className="text-[11px] text-muted">{l.tipe ? namaMetode(l.tipe) : ''}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block max-w-40 truncate text-ink">{l.nama_dosen ?? '–'}</span>
                      </td>
                      <td className="tnum px-3 py-2.5 text-ink">{l.minggu_ke ?? '–'}</td>
                      <td className="tnum px-3 py-2.5 whitespace-nowrap text-ink">
                        {formatTanggal(l.tanggal)}
                        {l.waktu ? <span className="text-muted"> {l.waktu.slice(0, 5)}</span> : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <HadirPill hadir={l.dosen_hadir} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={l.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            ukuran="sm"
                            variasi="halus"
                            onClick={() => {
                              setGalat(null)
                              setDetail(l)
                            }}
                            ikon={<Eye className="size-3.5" />}
                          >
                            Detail
                          </Button>
                          {l.status === 'baru' ? (
                            <>
                              <Button
                                ukuran="sm"
                                variasi="sekunder"
                                onClick={() => {
                                  setGalat(null)
                                  setEdit(l)
                                }}
                                ikon={<Pencil className="size-3.5" />}
                              >
                                Ubah
                              </Button>
                              {l.penugasan_id && l.minggu_ke !== null ? (
                                <Button
                                  ukuran="sm"
                                  variasi="utama"
                                  disabled={terapkan.isPending}
                                  onClick={() => void terapkanKeRekap(l)}
                                  ikon={<Check className="size-3.5" />}
                                >
                                  Terima
                                </Button>
                              ) : null}
                              <Button
                                ukuran="sm"
                                variasi="halus"
                                onClick={() => {
                                  setGalat(null)
                                  setAlasan('')
                                  setAkanTolak(l)
                                }}
                                className="text-alfa hover:bg-alfa-soft"
                                ikon={<X className="size-3.5" />}
                              >
                                Tolak
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:hidden">
            {tersaring.map((l) => (
              <article key={l.id} className="rounded-[10px] border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-ink">{l.nama_ketua}</h3>
                    <p className="truncate text-[13px] text-muted">{l.kelas?.nama ?? '–'}</p>
                  </div>
                  <StatusPill status={l.status} />
                </div>
                <p className="mt-2 text-[13px] text-ink">{l.mata_kuliah ?? '–'}</p>
                <p className="text-[12px] text-muted">{l.nama_dosen ?? '–'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <HadirPill hadir={l.dosen_hadir} />
                  <span className="tnum text-[12px] text-muted">
                    Pekan {l.minggu_ke ?? '–'} · {formatTanggal(l.tanggal)}
                  </span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <Button
                    ukuran="sm"
                    variasi="sekunder"
                    onClick={() => {
                      setGalat(null)
                      setDetail(l)
                    }}
                    ikon={<Eye className="size-3.5" />}
                  >
                    Detail
                  </Button>
                  {l.status === 'baru' ? (
                    <>
                      <Button
                        ukuran="sm"
                        variasi="sekunder"
                        onClick={() => {
                          setGalat(null)
                          setEdit(l)
                        }}
                        ikon={<Pencil className="size-3.5" />}
                      >
                        Ubah
                      </Button>
                      {l.penugasan_id && l.minggu_ke !== null ? (
                        <Button
                          ukuran="sm"
                          variasi="utama"
                          disabled={terapkan.isPending}
                          onClick={() => void terapkanKeRekap(l)}
                          ikon={<Check className="size-3.5" />}
                        >
                          Terima
                        </Button>
                      ) : null}
                      <Button
                        ukuran="sm"
                        variasi="halus"
                        onClick={() => {
                          setGalat(null)
                          setAlasan('')
                          setAkanTolak(l)
                        }}
                        className="text-alfa hover:bg-alfa-soft"
                        ikon={<X className="size-3.5" />}
                      >
                        Tolak
                      </Button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <Modal
        terbuka={detail !== null}
        judul="Detail laporan"
        deskripsi={detail ? `${detail.nama_ketua} · ${detail.kelas?.nama ?? ''}` : undefined}
        onTutup={() => setDetail(null)}
        footer={
          detail ? (
            <>
              {detail.status === 'baru' ? (
                <>
                  <Button
                    variasi="sekunder"
                    onClick={() => {
                      setDetail(null)
                      setEdit(detail)
                    }}
                    className="sm:mr-auto"
                    ikon={<Pencil className="size-4" />}
                  >
                    Ubah
                  </Button>
                  <Button
                    variasi="halus"
                    onClick={() => {
                      setGalat(null)
                      setAlasan('')
                      setDetail(null)
                      setAkanTolak(detail)
                    }}
                    className="text-alfa"
                    ikon={<X className="size-4" />}
                  >
                    Tolak
                  </Button>
                </>
              ) : (
                <span className="sm:mr-auto" />
              )}
              {detail.status === 'baru' && detail.penugasan_id ? (
                <Button
                  variasi="utama"
                  memuat={terapkan.isPending}
                  onClick={() => void terapkanKeRekap(detail)}
                  ikon={<Check className="size-4" />}
                >
                  Terima &amp; masukkan rekap
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        {detail ? (
          <div className="flex flex-col gap-3 text-[13px]">
            {galat ? <InlineError pesan={galat} /> : null}
            <Baris label="Waktu lapor" nilai={new Date(detail.dibuat_pada).toLocaleString('id-ID')} />
            <Baris label="Ketua kelas" nilai={detail.nama_ketua} />
            <Baris label="Kelas" nilai={detail.kelas?.nama ?? '–'} />
            <Baris label="Mata kuliah" nilai={detail.mata_kuliah ?? '–'} />
            <Baris label="Dosen" nilai={detail.nama_dosen ?? '–'} />
            <Baris label="Tipe" nilai={detail.tipe ? namaMetode(detail.tipe) : '–'} />
            <Baris label="Pekan" nilai={detail.minggu_ke ? `Pekan ${detail.minggu_ke}` : '–'} />
            <Baris label="Tanggal" nilai={formatTanggal(detail.tanggal)} />
            <Baris label="Waktu" nilai={detail.waktu ? detail.waktu.slice(0, 5) : '–'} />
            <Baris
              label="Status dosen"
              nilai={detail.dosen_hadir ? 'Dosen hadir' : 'Dosen tidak hadir'}
            />
            <Baris label="Status laporan" nilai={STATUS_LABEL[detail.status]} />
            {detail.diverifikasi_pada ? (
              <Baris
                label="Diverifikasi"
                nilai={new Date(detail.diverifikasi_pada).toLocaleString('id-ID')}
              />
            ) : null}
            {detail.catatan_verifikasi ? (
              <Baris label="Alasan penolakan" nilai={detail.catatan_verifikasi} />
            ) : null}
            {detail.catatan ? <Baris label="Catatan" nilai={detail.catatan} /> : null}
            {detail.dokumentasi_url ? (
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                  Dokumentasi
                </p>
                <a
                  href={detail.dokumentasi_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-strong underline"
                >
                  Buka tautan <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            ) : null}
            <p className="rounded-[6px] bg-surface-2 px-3 py-2 text-[12px] text-muted">
              "Terima" menandai pekan {detail.minggu_ke ?? '–'} sebagai{' '}
              {detail.dosen_hadir ? 'Hadir' : 'Tidak hadir'} pada data dosen dan mengubah
              status laporan menjadi Terverifikasi. "Tolak" tidak mengubah rekap.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        terbuka={akanTolak !== null}
        judul="Tolak laporan"
        deskripsi={
          akanTolak
            ? `${akanTolak.nama_ketua} · ${akanTolak.kelas?.nama ?? ''}`
            : undefined
        }
        onTutup={() => setAkanTolak(null)}
        footer={
          <>
            <Button variasi="halus" onClick={() => setAkanTolak(null)} className="sm:mr-auto">
              Batal
            </Button>
            <Button
              variasi="bahaya"
              memuat={tolak.isPending}
              onClick={() => void konfirmasiTolak()}
            >
              Tolak laporan
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-[13px]">
          {galat ? <InlineError pesan={galat} /> : null}
          <p className="text-ink">
            Laporan ini tidak akan masuk rekap. Tuliskan alasan agar ketua kelas tahu
            penyebabnya (mis. bukti tidak jelas, bukan jadwal, data ganda).
          </p>
          <label className="text-[13px] font-semibold text-ink" htmlFor="alasan-tolak">
            Alasan penolakan
          </label>
          <Textarea
            id="alasan-tolak"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="cth. Dokumentasi tidak sesuai / bukan pekan pada jadwal."
          />
        </div>
      </Modal>
      <UbahLaporanDialog laporan={edit} onTutup={() => setEdit(null)} />
    </div>
  )
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-b-0">
      <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">
        {label}
      </span>
      <span className="text-right text-ink">{nilai}</span>
    </div>
  )
}

function Kartu({
  label,
  nilai,
  perhatian,
}: {
  label: string
  nilai: number
  perhatian?: boolean
}) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className={`tnum mt-1 text-2xl font-extrabold ${perhatian ? 'text-alfa' : 'text-ink'}`}>
        {nilai}
      </p>
    </div>
  )
}
