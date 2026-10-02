import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { InlineError } from '@/components/ui/Feedback'
import { STATUS_META, URUTAN_STATUS } from '@/components/StatusPertemuan'
import { useToast } from '@/components/ui/Toast'
import { useSimpanPertemuan } from '@/hooks/useRekap'
import { pesanError } from '@/lib/api'
import { formatTanggal } from '@/lib/format'
import type { RekapBaris, StatusPertemuan } from '@/lib/types'

interface Props {
  terbuka: boolean
  baris: RekapBaris | null
  minggu: number | null
  onTutup: () => void
}

export function PertemuanDialog({ terbuka, baris, minggu, onTutup }: Props) {
  const simpan = useSimpanPertemuan()
  const { tampil } = useToast()
  const [status, setStatus] = useState<StatusPertemuan>('belum')
  const [tanggal, setTanggal] = useState('')
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState<string | null>(null)

  const existing = baris?.pertemuan.find((p) => p.minggu_ke === minggu)

  useEffect(() => {
    if (!terbuka) return
    setStatus(existing?.status ?? 'belum')
    setTanggal(existing?.tanggal ?? '')
    setCatatan(existing?.catatan ?? '')
    setGalat(null)
  }, [terbuka, existing?.status, existing?.tanggal, existing?.catatan])

  if (!baris || minggu === null) return null

  const judulMk = baris.mata_kuliah
    ? `${baris.mata_kuliah.kode} · ${baris.mata_kuliah.nama}`
    : 'Mata kuliah'

  async function simpanData() {
    if (!baris || minggu === null) return
    setGalat(null)
    try {
      await simpan.mutateAsync({
        penugasanId: baris.id,
        mingguKe: minggu,
        tanggal: tanggal || null,
        status,
        catatan: catatan.trim() || null,
      })
      tampil(`Pekan ${minggu} tersimpan.`, 'sukses')
      onTutup()
    } catch (err) {
      setGalat(pesanError(err))
    }
  }

  return (
    <Modal
      terbuka={terbuka}
      judul={`Pekan ${minggu}`}
      deskripsi={`${baris.dosen?.nama ?? 'Dosen'} · ${judulMk} · ${
        baris.metode === 'T' ? 'Teori' : 'Praktik'
      }`}
      onTutup={onTutup}
      footer={
        <>
          <Button variasi="halus" onClick={onTutup} className="sm:mr-auto">
            Batal
          </Button>
          <Button
            variasi="utama"
            memuat={simpan.isPending}
            onClick={() => void simpanData()}
          >
            Simpan pekan
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {galat ? <InlineError pesan={galat} /> : null}

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-ink">
            Status pelaksanaan
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {URUTAN_STATUS.map((s) => {
              const meta = STATUS_META[s]
              const aktif = status === s
              return (
                <label
                  key={s}
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[6px] border px-3 py-2 text-[13px] font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                    aktif
                      ? 'border-brand bg-brand-soft text-brand-strong'
                      : 'border-line-strong bg-surface text-ink hover:bg-surface-2'
                  }`}
                >
                  <input
                    type="radio"
                    name={`status-pekan-${minggu}`}
                    value={s}
                    checked={aktif}
                    onChange={() => setStatus(s)}
                    className="sr-only"
                  />
                  <span aria-hidden="true" className={meta.teks}>
                    {meta.tanda}
                  </span>
                  {meta.label}
                </label>
              )
            })}
          </div>
        </fieldset>

        <Field
          label="Tanggal pelaksanaan"
          petunjuk="Menentukan bulan untuk filter rekap."
          opsional
        >
          {(p) => (
            <Input
              {...p}
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          )}
        </Field>

        <Field label="Catatan" opsional>
          {(p) => (
            <Textarea
              {...p}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Materi, kendala, atau keterangan lain"
            />
          )}
        </Field>

        <p className="text-xs text-muted">
          {existing
            ? `Terakhir diperbarui ${formatTanggal(
                existing.updated_at?.slice(0, 10) ?? null,
              )}.`
            : 'Pekan ini belum tercatat. Menyimpan akan membuat entri baru.'}
        </p>
      </div>
    </Modal>
  )
}
