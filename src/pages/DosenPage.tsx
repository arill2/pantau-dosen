import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Confirm } from '@/components/ui/Confirm'
import { InlineError } from '@/components/ui/Feedback'
import { MasterTable, type Kolom } from '@/components/MasterTable'
import { Toolbar } from '@/components/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { StatusAktif } from '@/components/StatusAktif'
import {
  useDosen,
  useHapusDosen,
  useSimpanDosen,
} from '@/hooks/useMasterData'
import { pesanError } from '@/lib/api'
import type { Dosen } from '@/lib/types'

interface NilaiForm {
  id?: string
  nama: string
  nidn: string
  aktif: boolean
}

const FORM_KOSONG: NilaiForm = { nama: '', nidn: '', aktif: true }

export function DosenPage() {
  const query = useDosen()
  const simpan = useSimpanDosen()
  const hapus = useHapusDosen()
  const { tampil } = useToast()

  const [cari, setCari] = useState('')
  const [form, setForm] = useState<NilaiForm | null>(null)
  const [galatForm, setGalatForm] = useState<string | null>(null)
  const [akanHapus, setAkanHapus] = useState<Dosen | null>(null)
  const [galatHapus, setGalatHapus] = useState<string | null>(null)

  const kolom: Kolom<Dosen>[] = [
    {
      judul: 'Nama dosen',
      utama: true,
      render: (d) => <span className="font-semibold text-ink">{d.nama}</span>,
    },
    {
      judul: 'NIDN / NIP',
      render: (d) =>
        d.nidn ? (
          <span className="tnum text-ink">{d.nidn}</span>
        ) : (
          <span className="text-muted">–</span>
        ),
    },
    {
      judul: 'Status',
      render: (d) => <StatusAktif aktif={d.aktif} />,
    },
    {
      judul: 'Aksi',
      className: 'w-40',
      render: (d) => (
        <div className="flex justify-end gap-1.5">
          <Button
            ukuran="sm"
            variasi="halus"
            onClick={() => setForm({ id: d.id, nama: d.nama, nidn: d.nidn ?? '', aktif: d.aktif })}
            ikon={<Pencil className="size-3.5" />}
          >
            Ubah
          </Button>
          <Button
            ukuran="sm"
            variasi="halus"
            onClick={() => {
              setGalatHapus(null)
              setAkanHapus(d)
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
    if (form.nama.trim().length === 0) {
      setGalatForm('Nama dosen wajib diisi.')
      return
    }
    setGalatForm(null)
    try {
      await simpan.mutateAsync({
        id: form.id,
        nama: form.nama.trim(),
        nidn: form.nidn.trim() || null,
        aktif: form.aktif,
      })
      tampil(form.id ? 'Data dosen diperbarui.' : 'Dosen baru ditambahkan.', 'sukses')
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
      tampil('Dosen dihapus.', 'sukses')
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
        placeholder="Cari nama atau NIDN"
        jumlah={query.data?.length ?? 0}
        labelJumlah="dosen"
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
          Tambah dosen
        </Button>
      </Toolbar>

      <MasterTable
        query={query}
        kolom={kolom}
        barisKunci={(d) => d.id}
        saring={(d) => `${d.nama} ${d.nidn ?? ''}`}
        kataKunci={cari}
        judulKosong="Belum ada dosen"
        pesanKosong="Tambahkan dosen terlebih dahulu agar bisa ditugaskan pada mata kuliah."
        aksiKosong={
          <Button
            variasi="utama"
            onClick={() => setForm(FORM_KOSONG)}
            ikon={<Plus className="size-4" />}
          >
            Tambah dosen
          </Button>
        }
      />

      <Modal
        terbuka={form !== null}
        judul={form?.id ? 'Ubah data dosen' : 'Tambah dosen'}
        deskripsi="Nama wajib diisi. NIDN/NIP bersifat opsional."
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
            <Field label="Nama dosen">
              {(p) => (
                <Input
                  {...p}
                  value={form.nama}
                  autoFocus
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="cth. Dr. Siti Rahmawati, M.T."
                />
              )}
            </Field>
            <Field label="NIDN / NIP" opsional>
              {(p) => (
                <Input
                  {...p}
                  value={form.nidn}
                  inputMode="numeric"
                  onChange={(e) => setForm({ ...form, nidn: e.target.value })}
                  placeholder="cth. 0012345678"
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
              Dosen aktif (dapat ditugaskan)
            </label>
          </div>
        ) : null}
      </Modal>

      <Confirm
        terbuka={akanHapus !== null}
        judul="Hapus dosen"
        pesan={`Hapus "${akanHapus?.nama ?? ''}" secara permanen? Bila dosen ini masih punya penugasan, penghapusan akan ditolak. Untuk menyimpan riwayat, nonaktifkan lewat tombol Ubah.`}
        labelKonfirmasi="Hapus permanen"
        memuat={hapus.isPending}
        galat={galatHapus}
        onBatal={() => setAkanHapus(null)}
        onKonfirmasi={() => void konfirmasiHapus()}
      />
    </div>
  )
}
