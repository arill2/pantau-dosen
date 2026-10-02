import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { InlineError } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { laporDaftarKelas, useUbahLaporan } from '@/lib/laporan'
import { pesanError } from '@/lib/api'
import { namaMetode } from '@/lib/format'
import type { DaftarLapor, Laporan } from '@/lib/types'

const MINGGU = Array.from({ length: 16 }, (_, i) => i + 1)

interface Props {
  laporan: Laporan | null
  onTutup: () => void
}

export function UbahLaporanDialog({ laporan, onTutup }: Props) {
  const { tampil } = useToast()
  const simpan = useUbahLaporan()
  const [opsi, setOpsi] = useState<DaftarLapor[]>([])
  const [memuatOpsi, setMemuatOpsi] = useState(false)
  const [namaKetua, setNamaKetua] = useState('')
  const [penugasanId, setPenugasanId] = useState('')
  const [minggu, setMinggu] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [waktu, setWaktu] = useState('')
  const [hadir, setHadir] = useState<'hadir' | 'tidak'>('hadir')
  const [catatan, setCatatan] = useState('')
  const [dokumentasi, setDokumentasi] = useState('')
  const [galat, setGalat] = useState<string | null>(null)

  useEffect(() => {
    if (!laporan) return
    setNamaKetua(laporan.nama_ketua)
    setPenugasanId(laporan.penugasan_id ?? '')
    setMinggu(laporan.minggu_ke ? String(laporan.minggu_ke) : '')
    setTanggal(laporan.tanggal ?? '')
    setWaktu(laporan.waktu ? laporan.waktu.slice(0, 5) : '')
    setHadir(laporan.dosen_hadir ? 'hadir' : 'tidak')
    setCatatan(laporan.catatan ?? '')
    setDokumentasi(laporan.dokumentasi_url ?? '')
    setGalat(null)

    let aktif = true
    setMemuatOpsi(true)
    laporDaftarKelas(laporan.kelas_id)
      .then((d) => {
        if (aktif) setOpsi(d)
      })
      .catch(() => {
        if (aktif) setOpsi([])
      })
      .finally(() => {
        if (aktif) setMemuatOpsi(false)
      })
    return () => {
      aktif = false
    }
  }, [laporan])

  const terpilih = opsi.find((o) => o.penugasan_id === penugasanId) ?? null

  async function kirim() {
    if (!laporan) return
    if (!namaKetua.trim()) return setGalat('Nama ketua kelas wajib diisi.')
    if (!penugasanId) return setGalat('Pilih mata kuliah.')
    if (!minggu) return setGalat('Pilih pekan pertemuan.')
    if (!tanggal) return setGalat('Isi tanggal pembelajaran.')
    setGalat(null)
    try {
      await simpan.mutateAsync({
        id: laporan.id,
        namaKetua: namaKetua.trim(),
        penugasanId,
        minggu: Number(minggu),
        tanggal,
        waktu,
        dosenHadir: hadir === 'hadir',
        catatan,
        dokumentasi,
      })
      tampil('Perubahan laporan disimpan.', 'sukses')
      onTutup()
    } catch (err) {
      setGalat(pesanError(err))
    }
  }

  return (
    <Modal
      terbuka={laporan !== null}
      judul="Ubah laporan ketua kelas"
      deskripsi={laporan ? `${laporan.kelas?.nama ?? ''} · sebelum disetujui` : undefined}
      onTutup={onTutup}
      footer={
        <>
          <Button variasi="halus" onClick={onTutup} className="sm:mr-auto">
            Batal
          </Button>
          <Button variasi="utama" memuat={simpan.isPending} onClick={() => void kirim()}>
            Simpan perubahan
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {galat ? <InlineError pesan={galat} /> : null}

        <Field label="Nama ketua kelas">
          {(p) => (
            <Input
              {...p}
              value={namaKetua}
              onChange={(e) => setNamaKetua(e.target.value)}
            />
          )}
        </Field>

        <Field label="Mata kuliah & dosen">
          {(p) =>
            memuatOpsi ? (
              <p className="text-[13px] text-muted">Memuat mata kuliah…</p>
            ) : (
              <Select
                {...p}
                value={penugasanId}
                onChange={(e) => setPenugasanId(e.target.value)}
              >
                <option value="">Pilih mata kuliah</option>
                {opsi.map((o) => (
                  <option key={o.penugasan_id} value={o.penugasan_id}>
                    {o.mata_kuliah} · {o.nama_dosen} ({o.metode === 'T' ? 'Teori' : 'Praktik'})
                  </option>
                ))}
              </Select>
            )
          }
        </Field>

        {terpilih ? (
          <p className="rounded-[6px] bg-surface-2 px-3 py-2 text-[12px] text-muted">
            Dosen: <strong className="text-ink">{terpilih.nama_dosen}</strong> ·{' '}
            {namaMetode(terpilih.metode)}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Pekan">
            {(p) => (
              <Select {...p} value={minggu} onChange={(e) => setMinggu(e.target.value)}>
                <option value="">Pilih</option>
                {MINGGU.map((m) => (
                  <option key={m} value={m}>
                    Pekan {m}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Tanggal">
            {(p) => (
              <Input
                {...p}
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            )}
          </Field>
          <Field label="Waktu" opsional>
            {(p) => (
              <Input
                {...p}
                type="time"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
              />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-ink">
            Kehadiran dosen
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['hadir', 'Dosen hadir', 'bg-hadir-soft text-hadir border-hadir'],
                ['tidak', 'Dosen tidak hadir', 'bg-alfa-soft text-alfa border-alfa'],
              ] as const
            ).map(([nilai, label, kelasAktif]) => {
              const aktif = hadir === nilai
              return (
                <label
                  key={nilai}
                  className={`flex min-h-11 cursor-pointer items-center justify-center rounded-[6px] border px-3 py-2 text-[13px] font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                    aktif ? kelasAktif : 'border-line-strong bg-surface text-ink hover:bg-surface-2'
                  }`}
                >
                  <input
                    type="radio"
                    name="hadir-edit"
                    value={nilai}
                    checked={aktif}
                    onChange={() => setHadir(nilai)}
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
            <Textarea {...p} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          )}
        </Field>

        <Field label="Dokumentasi" opsional>
          {(p) => (
            <Input
              {...p}
              type="url"
              value={dokumentasi}
              onChange={(e) => setDokumentasi(e.target.value)}
              placeholder="https://..."
            />
          )}
        </Field>
      </div>
    </Modal>
  )
}