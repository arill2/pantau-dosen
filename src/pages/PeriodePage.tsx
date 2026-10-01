import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Confirm } from '@/components/ui/Confirm'
import { InlineError } from '@/components/ui/Feedback'
import { MasterTable, type Kolom } from '@/components/MasterTable'
import { Toolbar } from '@/components/Toolbar'
import { StatusAktif } from '@/components/StatusAktif'
import { useToast } from '@/components/ui/Toast'
import {
  useHapusPeriode,
  useNonaktifkanPeriodeLain,
  usePeriode,
  useSimpanPeriode,
} from '@/hooks/useMasterData'
import { pesanError } from '@/lib/api'
import { formatTanggal } from '@/lib/format'
import type { Periode } from '@/lib/types'

interface NilaiForm {
  id?: string
  nama: string
  tgl_mulai: string
  tgl_selesai: string
  aktif: boolean
}

const FORM_KOSONG: NilaiForm = {
  nama: '',
  tgl_mulai: '',
  tgl_selesai: '',
  aktif: false,
}

export function PeriodePage() {
  const query = usePeriode()
  const simpan = useSimpanPeriode()
  const hapus = useHapusPeriode()
  const nonaktifkanLain = useNonaktifkanPeriodeLain()
  const { tampil } = useToast()

  const [cari, setCari] = useState('')
  const [form, setForm] = useState<NilaiForm | null>(null)
  const [galatForm, setGalatForm] = useState<string | null>(null)
  const [akanHapus, setAkanHapus] = useState<Periode | null>(null)
  const [galatHapus, setGalatHapus] = useState<string | null>(null)

  const kolom: Kolom<Periode>[] = [
    {
      judul: 'Periode',
      utama: true,
      render: (p) => <span className="font-semibold text-ink">{p.nama}</span>,
    },
    {
      judul: 'Tanggal mulai',
      render: (p) => <span className="tnum text-ink">{formatTanggal(p.tgl_mulai)}</span>,
    },
    {
      judul: 'Tanggal selesai',
      render: (p) => <span className="tnum text-ink">{formatTanggal(p.tgl_selesai)}</span>,
    },
    { judul: 'Status', render: (p) => <StatusAktif aktif={p.aktif} /> },
    {
      judul: 'Aksi',
      className: 'w-40',
      render: (p) => (
        <div className="flex justify-end gap-1.5">
          <Button
            ukuran="sm"
            variasi="halus"
            onClick={() =>
              setForm({
                id: p.id,
                nama: p.nama,
                tgl_mulai: p.tgl_mulai,
                tgl_selesai: p.tgl_selesai,
                aktif: p.aktif,
              })
            }
            ikon={<Pencil className="size-3.5" />}
          >
            Ubah
          </Button>
          <Button
            ukuran="sm"
            variasi="halus"
            onClick={() => {
              setGalatHapus(null)
              setAkanHapus(p)
            }}
            className="text-alfa hover:bg-alfa-soft"
            ikon={<Trash2 className="size-3.5" />}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ]

  async function kirim() {
    if (!form) return
    if (!form.nama.trim()) return setGalatForm('Nama periode wajib diisi.')
    if (!form.tgl_mulai) return setGalatForm('Tanggal mulai wajib diisi.')
    if (!form.tgl_selesai) return setGalatForm('Tanggal selesai wajib diisi.')
    if (form.tgl_selesai < form.tgl_mulai)
      return setGalatForm('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.')

    setGalatForm(null)
    try {
      if (form.aktif) await nonaktifkanLain.mutateAsync(form.id ?? null)
      await simpan.mutateAsync({
        id: form.id,
        nama: form.nama.trim(),
        tgl_mulai: form.tgl_mulai,
        tgl_selesai: form.tgl_selesai,
        aktif: form.aktif,
      })
      tampil(form.id ? 'Periode diperbarui.' : 'Periode ditambahkan.', 'sukses')
      setForm(null)
    } catch (err) {
      setGalatForm(pesanError(err))
    }
  }

  async function konfirmasiHapus() {
    if (!akanHapus) return
    setGalatHapus(null)
    try {
      await hapus.mutateAsync(akanHapus.id)
      tampil('Periode dihapus.', 'sukses')
      setAkanHapus(null)
    } catch (err) {
      setGalatHapus(pesanError(err))
    }
  }

  const memuatSimpan = simpan.isPending || nonaktifkanLain.isPending

  return (
    <div className="flex flex-col gap-4">
      <Toolbar
        cari={cari}
        setCari={setCari}
        placeholder="Cari nama periode"
        jumlah={query.data?.length ?? 0}
        labelJumlah="periode"
      >
        <Button
          variasi="utama"
          onClick={() => {
            setGalatForm(null)
            setForm(FORM_KOSONG)
          }}
          ikon={<Plus className="size-4" />}
          className="w-full sm:w-auto"
        >
          Tambah periode
        </Button>
      </Toolbar>

      <MasterTable
        query={query}
        kolom={kolom}
        barisKunci={(p) => p.id}
        saring={(p) => p.nama}
        kataKunci={cari}
        judulKosong="Belum ada periode"
        pesanKosong="Buat periode seperti 2026/2027 Ganjil untuk mulai mencatat pertemuan."
        aksiKosong={
          <Button
            variasi="utama"
            onClick={() => setForm(FORM_KOSONG)}
            ikon={<Plus className="size-4" />}
          >
            Tambah periode
          </Button>
        }
      />

      <Modal
        terbuka={form !== null}
        judul={form?.id ? 'Ubah periode' : 'Tambah periode'}
        deskripsi="Satu periode mewakili satu semester dengan maksimal 16 pertemuan."
        onTutup={() => setForm(null)}
        footer={
          <>
            <Button variasi="halus" onClick={() => setForm(null)} className="sm:mr-auto">
              Batal
            </Button>
            <Button variasi="utama" memuat={memuatSimpan} onClick={() => void kirim()}>
              Simpan
            </Button>
          </>
        }
      >
        {form ? (
          <div className="flex flex-col gap-4">
            {galatForm ? <InlineError pesan={galatForm} /> : null}
            <Field label="Nama periode">
              {(p) => (
                <Input
                  {...p}
                  value={form.nama}
                  autoFocus
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="cth. 2026/2027 Ganjil"
                />
              )}
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tanggal mulai">
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    value={form.tgl_mulai}
                    onChange={(e) => setForm({ ...form, tgl_mulai: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Tanggal selesai">
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    value={form.tgl_selesai}
                    onChange={(e) => setForm({ ...form, tgl_selesai: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <label className="flex min-h-11 items-center gap-2.5 text-[13px] font-medium text-ink">
              <input
                type="checkbox"
                checked={form.aktif}
                onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                className="size-4 accent-[var(--brand)]"
              />
              Jadikan periode aktif
            </label>
            <p className="text-xs text-muted">
              Menandai periode ini aktif otomatis menonaktifkan periode lain.
            </p>
          </div>
        ) : null}
      </Modal>

      <Confirm
        terbuka={akanHapus !== null}
        judul="Hapus periode"
        pesan={`Hapus "${akanHapus?.nama ?? ''}"? Seluruh penugasan dan pertemuan di dalamnya ikut terhapus.`}
        labelKonfirmasi="Hapus periode"
        memuat={hapus.isPending}
        galat={galatHapus}
        onBatal={() => setAkanHapus(null)}
        onKonfirmasi={() => void konfirmasiHapus()}
      />
    </div>
  )
}