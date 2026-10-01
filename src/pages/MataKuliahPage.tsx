import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Confirm } from '@/components/ui/Confirm'
import { InlineError } from '@/components/ui/Feedback'
import { MasterTable, type Kolom } from '@/components/MasterTable'
import { Toolbar } from '@/components/Toolbar'
import { StatusAktif } from '@/components/StatusAktif'
import { useToast } from '@/components/ui/Toast'
import {
  useHapusMataKuliah,
  useMataKuliah,
  useSimpanMataKuliah,
} from '@/hooks/useMasterData'
import { pesanError } from '@/lib/api'
import type { MataKuliah, Metode } from '@/lib/types'

interface NilaiForm {
  id?: string
  kode: string
  nama: string
  sks: string
  metode_default: Metode
  aktif: boolean
}

const FORM_KOSONG: NilaiForm = {
  kode: '',
  nama: '',
  sks: '2',
  metode_default: 'T',
  aktif: true,
}

export function MataKuliahPage() {
  const query = useMataKuliah()
  const simpan = useSimpanMataKuliah()
  const hapus = useHapusMataKuliah()
  const { tampil } = useToast()

  const [cari, setCari] = useState('')
  const [form, setForm] = useState<NilaiForm | null>(null)
  const [galatForm, setGalatForm] = useState<string | null>(null)
  const [akanHapus, setAkanHapus] = useState<MataKuliah | null>(null)
  const [galatHapus, setGalatHapus] = useState<string | null>(null)

  const kolom: Kolom<MataKuliah>[] = [
    {
      judul: 'Kode',
      render: (m) => (
        <span className="tnum font-semibold text-ink">{m.kode}</span>
      ),
    },
    {
      judul: 'Mata kuliah',
      utama: true,
      render: (m) => <span className="text-ink">{m.nama}</span>,
    },
    {
      judul: 'SKS',
      render: (m) => <span className="tnum text-ink">{m.sks}</span>,
    },
    {
      judul: 'Metode bawaan',
      render: (m) => (
        <span className="text-ink">
          {m.metode_default === 'T' ? 'Teori' : 'Praktik'}
        </span>
      ),
    },
    { judul: 'Status', render: (m) => <StatusAktif aktif={m.aktif} /> },
    {
      judul: 'Aksi',
      className: 'w-40',
      render: (m) => (
        <div className="flex justify-end gap-1.5">
          <Button
            ukuran="sm"
            variasi="halus"
            onClick={() =>
              setForm({
                id: m.id,
                kode: m.kode,
                nama: m.nama,
                sks: String(m.sks),
                metode_default: m.metode_default,
                aktif: m.aktif,
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
              setAkanHapus(m)
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
    if (!form.kode.trim()) return setGalatForm('Kode mata kuliah wajib diisi.')
    if (!form.nama.trim()) return setGalatForm('Nama mata kuliah wajib diisi.')
    const sks = Number(form.sks)
    if (!Number.isInteger(sks) || sks < 1 || sks > 8)
      return setGalatForm('SKS harus berupa angka 1 sampai 8.')

    setGalatForm(null)
    try {
      await simpan.mutateAsync({
        id: form.id,
        kode: form.kode.trim().toUpperCase(),
        nama: form.nama.trim(),
        sks,
        metode_default: form.metode_default,
        aktif: form.aktif,
      })
      tampil(form.id ? 'Mata kuliah diperbarui.' : 'Mata kuliah ditambahkan.', 'sukses')
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
      tampil('Mata kuliah dihapus.', 'sukses')
      setAkanHapus(null)
    } catch (err) {
      setGalatHapus(pesanError(err))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Toolbar
        cari={cari}
        setCari={setCari}
        placeholder="Cari kode atau nama mata kuliah"
        jumlah={query.data?.length ?? 0}
        labelJumlah="mata kuliah"
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
          Tambah mata kuliah
        </Button>
      </Toolbar>

      <MasterTable
        query={query}
        kolom={kolom}
        barisKunci={(m) => m.id}
        saring={(m) => `${m.kode} ${m.nama}`}
        kataKunci={cari}
        judulKosong="Belum ada mata kuliah"
        pesanKosong="Tambahkan mata kuliah agar dapat ditugaskan ke dosen."
        aksiKosong={
          <Button
            variasi="utama"
            onClick={() => setForm(FORM_KOSONG)}
            ikon={<Plus className="size-4" />}
          >
            Tambah mata kuliah
          </Button>
        }
      />

      <Modal
        terbuka={form !== null}
        judul={form?.id ? 'Ubah mata kuliah' : 'Tambah mata kuliah'}
        onTutup={() => setForm(null)}
        footer={
          <>
            <Button variasi="halus" onClick={() => setForm(null)} className="sm:mr-auto">
              Batal
            </Button>
            <Button variasi="utama" memuat={simpan.isPending} onClick={() => void kirim()}>
              Simpan
            </Button>
          </>
        }
      >
        {form ? (
          <div className="flex flex-col gap-4">
            {galatForm ? <InlineError pesan={galatForm} /> : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1.6fr]">
              <Field label="Kode">
                {(p) => (
                  <Input
                    {...p}
                    value={form.kode}
                    autoFocus
                    spellCheck={false}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    placeholder="cth. MK101"
                  />
                )}
              </Field>
              <Field label="Nama mata kuliah">
                {(p) => (
                  <Input
                    {...p}
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="cth. Navigasi Laut"
                  />
                )}
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="SKS" petunjuk="1 sampai 8.">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={1}
                    max={8}
                    value={form.sks}
                    onChange={(e) => setForm({ ...form, sks: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Metode bawaan">
                {(p) => (
                  <Select
                    {...p}
                    value={form.metode_default}
                    onChange={(e) =>
                      setForm({ ...form, metode_default: e.target.value as Metode })
                    }
                  >
                    <option value="T">Teori</option>
                    <option value="P">Praktik</option>
                  </Select>
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
              Mata kuliah aktif
            </label>
          </div>
        ) : null}
      </Modal>

      <Confirm
        terbuka={akanHapus !== null}
        judul="Hapus mata kuliah"
        pesan={`Hapus "${akanHapus?.nama ?? ''}" secara permanen? Bila masih dipakai pada penugasan, penghapusan akan ditolak.`}
        labelKonfirmasi="Hapus permanen"
        memuat={hapus.isPending}
        galat={galatHapus}
        onBatal={() => setAkanHapus(null)}
        onKonfirmasi={() => void konfirmasiHapus()}
      />
    </div>
  )
}
