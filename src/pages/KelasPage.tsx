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
import { useHapusKelas, useKelas, useSimpanKelas } from '@/hooks/useMasterData'
import { pesanError } from '@/lib/api'
import type { Kelas } from '@/lib/types'

interface NilaiForm {
  id?: string
  nama: string
  program: string
  semester: string
  angkatan: string
  paralel: string
  keterangan: string
  aktif: boolean
}

const FORM_KOSONG: NilaiForm = {
  nama: '',
  program: '',
  semester: '',
  angkatan: '',
  paralel: '',
  keterangan: '',
  aktif: true,
}

export function KelasPage() {
  const query = useKelas()
  const simpan = useSimpanKelas()
  const hapus = useHapusKelas()
  const { tampil } = useToast()

  const [cari, setCari] = useState('')
  const [form, setForm] = useState<NilaiForm | null>(null)
  const [galatForm, setGalatForm] = useState<string | null>(null)
  const [akanHapus, setAkanHapus] = useState<Kelas | null>(null)
  const [galatHapus, setGalatHapus] = useState<string | null>(null)

  const kolom: Kolom<Kelas>[] = [
    {
      judul: 'Nama kelas',
      utama: true,
      render: (k) => <span className="font-semibold text-ink">{k.nama}</span>,
    },
    {
      judul: 'Program / Semester',
      render: (k) => (
        <span className="text-ink">
          {[k.program, k.semester].filter(Boolean).join(' · ') || '–'}
        </span>
      ),
    },
    {
      judul: 'Angkatan / Paralel',
      render: (k) => (
        <span className="tnum text-ink">
          {[k.angkatan, k.paralel].filter(Boolean).join(' / ') || '–'}
        </span>
      ),
    },
    {
      judul: 'Keterangan',
      render: (k) =>
        k.keterangan ? (
          <span className="text-ink">{k.keterangan}</span>
        ) : (
          <span className="text-muted">–</span>
        ),
    },
    { judul: 'Status', render: (k) => <StatusAktif aktif={k.aktif} /> },
    {
      judul: 'Aksi',
      className: 'w-40',
      render: (k) => (
        <div className="flex justify-end gap-1.5">
          <Button
            ukuran="sm"
            variasi="halus"
            onClick={() =>
              setForm({
                id: k.id,
                nama: k.nama,
                program: k.program ?? '',
                semester: k.semester ?? '',
                angkatan: k.angkatan ?? '',
                paralel: k.paralel ?? '',
                keterangan: k.keterangan ?? '',
                aktif: k.aktif,
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
              setAkanHapus(k)
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
    if (!form.nama.trim()) return setGalatForm('Nama kelas wajib diisi.')
    setGalatForm(null)
    try {
      await simpan.mutateAsync({
        id: form.id,
        nama: form.nama.trim(),
        program: form.program.trim() || null,
        semester: form.semester.trim() || null,
        angkatan: form.angkatan.trim() || null,
        paralel: form.paralel.trim().toUpperCase() || null,
        keterangan: form.keterangan.trim() || null,
        aktif: form.aktif,
      })
      tampil(form.id ? 'Kelas diperbarui.' : 'Kelas ditambahkan.', 'sukses')
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
      tampil('Kelas dihapus.', 'sukses')
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
        placeholder="Cari nama kelas"
        jumlah={query.data?.length ?? 0}
        labelJumlah="kelas"
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
          Tambah kelas
        </Button>
      </Toolbar>

      <MasterTable
        query={query}
        kolom={kolom}
        barisKunci={(k) => k.id}
        saring={(k) =>
          `${k.nama} ${k.keterangan ?? ''} ${k.program ?? ''} ${k.semester ?? ''} ${k.angkatan ?? ''} ${k.paralel ?? ''}`
        }
        kataKunci={cari}
        judulKosong="Belum ada kelas"
        pesanKosong="Tambahkan kelas (mis. Nautika 1A) agar bisa ditugaskan bersama dosen dan mata kuliah."
        aksiKosong={
          <Button
            variasi="utama"
            onClick={() => setForm(FORM_KOSONG)}
            ikon={<Plus className="size-4" />}
          >
            Tambah kelas
          </Button>
        }
      />

      <Modal
        terbuka={form !== null}
        judul={form?.id ? 'Ubah kelas' : 'Tambah kelas'}
        deskripsi="Nama kelas wajib. Keterangan bersifat opsional."
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
            <Field label="Nama kelas">
              {(p) => (
                <Input
                  {...p}
                  value={form.nama}
                  autoFocus
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="cth. D4 III-A (Ang.46)"
                />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Program" opsional>
                {(p) => (
                  <Input
                    {...p}
                    value={form.program}
                    onChange={(e) => setForm({ ...form, program: e.target.value })}
                    placeholder="D4 / DP-III"
                  />
                )}
              </Field>
              <Field label="Semester" opsional>
                {(p) => (
                  <Input
                    {...p}
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    placeholder="I / III / VII"
                  />
                )}
              </Field>
              <Field label="Angkatan" opsional>
                {(p) => (
                  <Input
                    {...p}
                    value={form.angkatan}
                    onChange={(e) => setForm({ ...form, angkatan: e.target.value })}
                    placeholder="46 / 43/44"
                  />
                )}
              </Field>
              <Field label="Paralel" opsional>
                {(p) => (
                  <Input
                    {...p}
                    value={form.paralel}
                    onChange={(e) => setForm({ ...form, paralel: e.target.value })}
                    placeholder="A"
                  />
                )}
              </Field>
            </div>
            <Field label="Keterangan" opsional>
              {(p) => (
                <Input
                  {...p}
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="cth. Prodi Nautika"
                />
              )}
            </Field>
            <label className="flex min-h-11 items-center gap-2.5 text-[13px] font-medium text-ink">
              <input
                type="checkbox"
                checked={form.aktif}
                onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                className="size-4 accent-[var(--brand)]"
              />
              Kelas aktif
            </label>
          </div>
        ) : null}
      </Modal>

      <Confirm
        terbuka={akanHapus !== null}
        judul="Hapus kelas"
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
