import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { InlineError, Spinner } from '@/components/ui/Feedback'
import {
  laporDaftarKelas,
  laporKelas,
  laporKirimKelas,
  laporPekanTerisiKelas,
} from '@/lib/laporan'
import { INSTANSI } from '@/lib/config'
import { namaMetode } from '@/lib/format'
import type { DaftarLapor, KelasOpsi } from '@/lib/types'

const MINGGU = Array.from({ length: 16 }, (_, i) => i + 1)

interface Nilai {
  namaKetua: string
  penugasanId: string
  minggu: string
  tanggal: string
  waktu: string
  hadir: 'hadir' | 'tidak' | ''
  catatan: string
  dokumentasi: string
}

const KOSONG: Nilai = {
  namaKetua: '',
  penugasanId: '',
  minggu: '',
  tanggal: '',
  waktu: '',
  hadir: '',
  catatan: '',
  dokumentasi: '',
}

export function LaporPage() {
  const [kelas, setKelas] = useState<KelasOpsi[]>([])
  const [memuatKelas, setMemuatKelas] = useState(true)
  const [kelasId, setKelasId] = useState('')
  const [daftar, setDaftar] = useState<DaftarLapor[]>([])
  const [memuatDaftar, setMemuatDaftar] = useState(false)
  const [pekanTerisi, setPekanTerisi] = useState<number[]>([])
  const [form, setForm] = useState<Nilai>(KOSONG)
  const [galat, setGalat] = useState<string | null>(null)
  const [galatForm, setGalatForm] = useState<string | null>(null)
  const [mengirim, setMengirim] = useState(false)
  const [sukses, setSukses] = useState<string | null>(null)

  const terpilih = useMemo(
    () => daftar.find((d) => d.penugasan_id === form.penugasanId) ?? null,
    [daftar, form.penugasanId],
  )
  const pekanSudahDilaporkan =
    form.minggu !== '' && pekanTerisi.includes(Number(form.minggu))

  useEffect(() => {
    let aktif = true
    laporKelas()
      .then((k) => {
        if (aktif) setKelas(k)
      })
      .catch((err) => {
        if (aktif) setGalat(err instanceof Error ? err.message : 'Gagal memuat kelas.')
      })
      .finally(() => {
        if (aktif) setMemuatKelas(false)
      })
    return () => {
      aktif = false
    }
  }, [])

  // Muat daftar mata kuliah ketika kelas dipilih.
  useEffect(() => {
    if (!kelasId) {
      setDaftar([])
      return
    }
    let aktif = true
    setMemuatDaftar(true)
    setForm((f) => ({ ...f, penugasanId: '', minggu: '' }))
    laporDaftarKelas(kelasId)
      .then((d) => {
        if (aktif) setDaftar(d)
      })
      .catch((err) => {
        if (aktif) setGalat(err instanceof Error ? err.message : 'Gagal memuat mata kuliah.')
      })
      .finally(() => {
        if (aktif) setMemuatDaftar(false)
      })
    return () => {
      aktif = false
    }
  }, [kelasId])

  // Muat pekan yang sudah dilaporkan untuk penugasan terpilih (cegah ganda).
  useEffect(() => {
    if (!kelasId || !form.penugasanId) {
      setPekanTerisi([])
      return
    }
    let aktif = true
    laporPekanTerisiKelas(kelasId, form.penugasanId)
      .then((p) => {
        if (aktif) setPekanTerisi(p)
      })
      .catch(() => {
        if (aktif) setPekanTerisi([])
      })
    return () => {
      aktif = false
    }
  }, [kelasId, form.penugasanId])

  async function kirim(e: FormEvent) {
    e.preventDefault()
    if (!kelasId) return setGalatForm('Pilih kelas.')
    if (!form.namaKetua.trim()) return setGalatForm('Nama ketua kelas wajib diisi.')
    if (!form.penugasanId) return setGalatForm('Pilih mata kuliah.')
    if (!form.minggu) return setGalatForm('Pilih minggu pertemuan.')
    if (!form.tanggal) return setGalatForm('Isi tanggal jadwal pembelajaran.')
    if (!form.hadir) return setGalatForm('Pilih apakah dosen hadir atau tidak.')
    if (!form.dokumentasi.trim())
      return setGalatForm('Dokumentasi (bukti) wajib diisi.')
    if (pekanSudahDilaporkan)
      return setGalatForm(
        'Pekan ini sudah pernah dilaporkan untuk mata kuliah ini. Pilih pekan lain.',
      )
    setGalatForm(null)
    setMengirim(true)
    try {
      await laporKirimKelas({
        kelasId,
        namaKetua: form.namaKetua.trim(),
        penugasanId: form.penugasanId,
        minggu: Number(form.minggu),
        tanggal: form.tanggal,
        waktu: form.waktu,
        dosenHadir: form.hadir === 'hadir',
        catatan: form.catatan,
        dokumentasi: form.dokumentasi,
      })
      const namaKelas = kelas.find((k) => k.id === kelasId)?.nama ?? ''
      setSukses(
        `${terpilih?.mata_kuliah ?? 'Laporan'} · Pekan ${form.minggu} · ${namaKelas}`,
      )
    } catch (err) {
      setGalatForm(err instanceof Error ? err.message : 'Gagal mengirim laporan.')
    } finally {
      setMengirim(false)
    }
  }

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-brand text-on-brand">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-[8px] bg-on-brand/15"
            >
              <CalendarClock className="size-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold">Laporan Pembelajaran</p>
              <p className="text-[11px] text-on-brand/80">{INSTANSI}</p>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center rounded-[6px] border border-on-brand/30 px-3 text-[12px] font-semibold transition-colors hover:bg-on-brand/10"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {sukses ? (
          <div className="rounded-[10px] border border-line bg-surface p-6 text-center">
            <CheckCircle2 className="mx-auto size-10 text-hadir" aria-hidden="true" />
            <h1 className="mt-3 text-lg font-extrabold text-ink">Laporan terkirim</h1>
            <p className="mt-1 text-[13px] text-muted">
              Terima kasih. Laporan menunggu <strong>verifikasi pengelola</strong> sebelum
              masuk ke rekap.
            </p>
            <p className="mt-3 rounded-[6px] bg-surface-2 px-3 py-2 text-[13px] text-ink">
              {sukses}
            </p>
            <Button
              variasi="utama"
              className="mt-5 w-full sm:w-auto"
              onClick={() => {
                setSukses(null)
                setForm(KOSONG)
                setPekanTerisi([])
              }}
            >
              Isi laporan lagi
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-[10px] border border-line bg-surface p-5">
              <h1 className="text-lg font-extrabold text-ink">
                Laporkan pelaksanaan pembelajaran
              </h1>
              <p className="mt-1 text-[13px] text-muted">
                Khusus ketua kelas. Pilih kelas, lalu isi sesuai jadwal.
              </p>
            </div>

            {galat ? (
              <div className="mb-4">
                <InlineError pesan={galat} />
              </div>
            ) : null}

            <form
              onSubmit={kirim}
              className="flex flex-col gap-4 rounded-[10px] border border-line bg-surface p-5"
            >
              {galatForm ? <InlineError pesan={galatForm} /> : null}

              <Field label="Kelas">
                {(p) =>
                  memuatKelas ? (
                    <div className="flex min-h-11 items-center gap-2 text-[13px] text-muted">
                      <Spinner /> Memuat kelas…
                    </div>
                  ) : (
                    <Select
                      {...p}
                      value={kelasId}
                      onChange={(e) => setKelasId(e.target.value)}
                    >
                      <option value="">Pilih kelas</option>
                      {kelas.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama}
                        </option>
                      ))}
                    </Select>
                  )
                }
              </Field>

              <Field label="Nama ketua kelas">
                {(p) => (
                  <Input
                    {...p}
                    value={form.namaKetua}
                    onChange={(e) => setForm({ ...form, namaKetua: e.target.value })}
                    placeholder="Nama lengkap"
                  />
                )}
              </Field>

              <Field label="Mata kuliah">
                {(p) =>
                  memuatDaftar ? (
                    <div className="flex min-h-11 items-center gap-2 text-[13px] text-muted">
                      <Spinner /> Memuat mata kuliah…
                    </div>
                  ) : (
                    <Select
                      {...p}
                      value={form.penugasanId}
                      disabled={!kelasId}
                      className="disabled:cursor-not-allowed disabled:opacity-55"
                      onChange={(e) =>
                        setForm({ ...form, penugasanId: e.target.value, minggu: '' })
                      }
                    >
                      <option value="">
                        {kelasId ? 'Pilih mata kuliah' : 'Pilih kelas dulu'}
                      </option>
                      {daftar.map((d) => (
                        <option key={d.penugasan_id} value={d.penugasan_id}>
                          {d.mata_kuliah} · {d.nama_dosen} (
                          {d.metode === 'T' ? 'Teori' : 'Praktik'})
                        </option>
                      ))}
                    </Select>
                  )
                }
              </Field>

              {terpilih ? (
                <div className="grid grid-cols-2 gap-3 rounded-[6px] bg-surface-2 px-3 py-2.5 text-[13px]">
                  <div>
                    <p className="text-[11px] font-semibold text-muted uppercase">Dosen</p>
                    <p className="text-ink">{terpilih.nama_dosen}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted uppercase">Tipe</p>
                    <p className="text-ink">{namaMetode(terpilih.metode)}</p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Minggu pertemuan">
                  {(p) => (
                    <Select
                      {...p}
                      value={form.minggu}
                      disabled={!form.penugasanId}
                      className="disabled:cursor-not-allowed disabled:opacity-55"
                      onChange={(e) => setForm({ ...form, minggu: e.target.value })}
                    >
                      <option value="">Pilih</option>
                      {MINGGU.map((m) => (
                        <option key={m} value={m} disabled={pekanTerisi.includes(m)}>
                          Pekan {m}
                          {pekanTerisi.includes(m) ? ' · sudah dilaporkan' : ''}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Tanggal pembelajaran">
                  {(p) => (
                    <Input
                      {...p}
                      type="date"
                      value={form.tanggal}
                      onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Waktu" opsional>
                  {(p) => (
                    <Input
                      {...p}
                      type="time"
                      value={form.waktu}
                      onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                    />
                  )}
                </Field>
              </div>

              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold text-ink">
                  Apakah dosen hadir melaksanakan pembelajaran?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['hadir', 'Dosen hadir', 'bg-hadir-soft text-hadir border-hadir'],
                      ['tidak', 'Dosen tidak hadir', 'bg-alfa-soft text-alfa border-alfa'],
                    ] as const
                  ).map(([nilai, label, kelasAktif]) => {
                    const aktif = form.hadir === nilai
                    return (
                      <label
                        key={nilai}
                        className={`flex min-h-12 cursor-pointer items-center justify-center rounded-[6px] border px-3 py-2 text-center text-[13px] font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                          aktif
                            ? kelasAktif
                            : 'border-line-strong bg-surface text-ink hover:bg-surface-2'
                        }`}
                      >
                        <input
                          type="radio"
                          name="hadir"
                          value={nilai}
                          checked={aktif}
                          onChange={() => setForm({ ...form, hadir: nilai })}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <Field label="Catatan" opsional>
                {(p) => (
                  <Textarea
                    {...p}
                    value={form.catatan}
                    onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                    placeholder="Materi, kendala, atau keterangan lain"
                  />
                )}
              </Field>

              <Field
                label="Dokumentasi (bukti)"
                petunjuk="Wajib. Tempel tautan foto/dokumen pembelajaran (mis. Google Drive)."
              >
                {(p) => (
                  <Input
                    {...p}
                    type="url"
                    value={form.dokumentasi}
                    onChange={(e) => setForm({ ...form, dokumentasi: e.target.value })}
                    placeholder="https://..."
                  />
                )}
              </Field>

              {pekanSudahDilaporkan ? (
                <div className="flex items-start gap-2 rounded-[6px] border border-alfa bg-alfa-soft px-3 py-2 text-[13px]">
                  <span aria-hidden="true" className="text-alfa">⚠</span>
                  <p className="text-ink">
                    Pekan <strong>{form.minggu}</strong> untuk mata kuliah ini sudah
                    dilaporkan. Pilih pekan lain supaya data tidak ganda.
                  </p>
                </div>
              ) : null}

              <Button
                type="submit"
                variasi="utama"
                memuat={mengirim}
                disabled={pekanSudahDilaporkan}
                className="mt-1 h-11 w-full"
              >
                Kirim laporan
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          Laporan diverifikasi pengelola sebelum masuk rekap. Hubungi pengelola bila ada
          kendala.
        </p>
      </main>
    </div>
  )
}