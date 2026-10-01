import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Confirm } from '@/components/ui/Confirm'
import { InlineError } from '@/components/ui/Feedback'
import { MasterTable, type Kolom } from '@/components/MasterTable'
import { Toolbar } from '@/components/Toolbar'
import { MiniTrack } from '@/components/WeekStrip'
import { useToast } from '@/components/ui/Toast'
import { useDosen, useMataKuliah, usePeriode } from '@/hooks/useMasterData'
import {
  useHapusPenugasan,
  usePenugasanLengkap,
  useSimpanPenugasan,
} from '@/hooks/useRekap'
import { usePengaturan } from '@/contexts/SettingsContext'
import { hitungRekap } from '@/lib/attendance'
import { formatPersen, namaMetode } from '@/lib/format'
import { pesanError } from '@/lib/api'
import type { PenugasanLengkap } from '@/lib/types'

interface NilaiForm {
  id?: string
  dosen_id: string
  mata_kuliah_id: string
  periode_id: string
  metode: 'T' | 'P'
}

export function PenugasanPage() {
  const query = usePenugasanLengkap()
  const { data: dosen = [] } = useDosen()
  const { data: mataKuliah = [] } = useMataKuliah()
  const { data: periode = [] } = usePeriode()
  const { aturan } = usePengaturan()
  const simpan = useSimpanPenugasan()
  const hapus = useHapusPenugasan()
  const { tampil } = useToast()

  const [cari, setCari] = useState('')
  const [form, setForm] = useState<NilaiForm | null>(null)
  const [galatForm, setGalatForm] = useState<string | null>(null)
  const [akanHapus, setAkanHapus] = useState<PenugasanLengkap | null>(null)
  const [galatHapus, setGalatHapus] = useState<string | null>(null)

  const bisaTambah = dosen.length > 0 && mataKuliah.length > 0 && periode.length > 0
  const aktifPeriode = periode.find((p) => p.aktif) ?? periode[0]

  function bukaForm() {
    setGalatForm(null)
    setForm({
      dosen_id: dosen[0]?.id ?? '',
      mata_kuliah_id: mataKuliah[0]?.id ?? '',
      periode_id: aktifPeriode?.id ?? '',
      metode: mataKuliah[0]?.metode_default ?? 'T',
    })
  }

  const kolom: Kolom<PenugasanLengkap>[] = [
    {
      judul: 'Dosen',
      utama: true,
      render: (p) => <span className="font-semibold text-ink">{p.dosen?.nama ?? '–'}</span>,
    },
    {
      judul: 'Mata kuliah',
      render: (p) => (
        <span className="text-ink">
          {p.mata_kuliah ? `${p.mata_kuliah.kode} · ${p.mata_kuliah.nama}` : '–'}
        </span>
      ),
    },
    {
      judul: 'Metode',
      render: (p) => (
        <span className="inline-grid size-6 place-items-center rounded-[4px] bg-brand-soft text-[11px] font-bold text-brand-strong">
          {p.metode}
        </span>
      ),
    },
    {
      judul: 'Periode',
      render: (p) => <span className="text-ink">{p.periode?.nama ?? '–'}</span>,
    },
    {
      judul: 'Progres 16 pekan',
      render: (p) => {
        const r = hitungRekap(p, 'semua', aturan)
        return (
          <div className="flex flex-col gap-1.5">
            <MiniTrack pertemuan={p.pertemuan} />
            <span className="tnum text-[11px] text-muted">
              {r.totalHadir}/{r.totalDihitung} hadir · {formatPersen(r.persentase)}
            </span>
          </div>
        )
      },
    },
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
                dosen_id: p.dosen?.id ?? '',
                mata_kuliah_id: p.mata_kuliah?.id ?? '',
                periode_id: p.periode?.id ?? '',
                metode: p.metode,
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
    if (!form.dosen_id) return setGalatForm('Pilih dosen.')
    if (!form.mata_kuliah_id) return setGalatForm('Pilih mata kuliah.')
    if (!form.periode_id) return setGalatForm('Pilih periode.')
    setGalatForm(null)
    try {
      await simpan.mutateAsync(form)
      tampil(form.id ? 'Penugasan diperbarui.' : 'Penugasan dibuat.', 'sukses')
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
      tampil('Penugasan dihapus.', 'sukses')
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
        placeholder="Cari dosen atau mata kuliah"
        jumlah={query.data?.length ?? 0}
        labelJumlah="penugasan"
      >
        <Button
          variasi="utama"
          onClick={bukaForm}
          disabled={!bisaTambah}
          ikon={<Plus className="size-4" />}
          className="w-full sm:w-auto"
        >
          Tambah penugasan
        </Button>
      </Toolbar>

      {!bisaTambah && (query.data?.length ?? 0) === 0 ? (
        <div className="rounded-[10px] border border-line bg-surface-2 px-4 py-3 text-[13px] text-muted">
          Lengkapi dahulu master data dosen, mata kuliah, dan periode sebelum membuat
          penugasan.
        </div>
      ) : null}

      <MasterTable
        query={query}
        kolom={kolom}
        barisKunci={(p) => p.id}
        saring={(p) =>
          `${p.dosen?.nama ?? ''} ${p.mata_kuliah?.nama ?? ''} ${p.mata_kuliah?.kode ?? ''}`
        }
        kataKunci={cari}
        judulKosong="Belum ada penugasan"
        pesanKosong="Hubungkan dosen dengan mata kuliah, metode, dan periode di sini."
        aksiKosong={
          bisaTambah ? (
            <Button variasi="utama" onClick={bukaForm} ikon={<Plus className="size-4" />}>
              Tambah penugasan
            </Button>
          ) : undefined
        }
      />

      <Modal
        terbuka={form !== null}
        judul={form?.id ? 'Ubah penugasan' : 'Tambah penugasan'}
        deskripsi="Satu mata kuliah dapat memiliki metode Teori dan Praktik sebagai dua penugasan."
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
            <Field label="Dosen">
              {(p) => (
                <Select
                  {...p}
                  value={form.dosen_id}
                  onChange={(e) => setForm({ ...form, dosen_id: e.target.value })}
                >
                  {dosen.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama}
                      {d.aktif ? '' : ' (nonaktif)'}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Mata kuliah">
              {(p) => (
                <Select
                  {...p}
                  value={form.mata_kuliah_id}
                  onChange={(e) => setForm({ ...form, mata_kuliah_id: e.target.value })}
                >
                  {mataKuliah.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.kode} · {m.nama}
                      {m.aktif ? '' : ' (nonaktif)'}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Periode">
                {(p) => (
                  <Select
                    {...p}
                    value={form.periode_id}
                    onChange={(e) => setForm({ ...form, periode_id: e.target.value })}
                  >
                    {periode.map((per) => (
                      <option key={per.id} value={per.id}>
                        {per.nama}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Metode">
                {(p) => (
                  <Select
                    {...p}
                    value={form.metode}
                    onChange={(e) =>
                      setForm({ ...form, metode: e.target.value as 'T' | 'P' })
                    }
                  >
                    <option value="T">Teori</option>
                    <option value="P">Praktik</option>
                  </Select>
                )}
              </Field>
            </div>
            <p className="text-xs text-muted">
              Metode terpilih: {namaMetode(form.metode)}.
            </p>
          </div>
        ) : null}
      </Modal>

      <Confirm
        terbuka={akanHapus !== null}
        judul="Hapus penugasan"
        pesan={`Hapus penugasan ${
          akanHapus?.dosen?.nama ?? ''
        } · ${akanHapus?.mata_kuliah?.nama ?? ''}? Seluruh pertemuan pada penugasan ini ikut terhapus.`}
        labelKonfirmasi="Hapus penugasan"
        memuat={hapus.isPending}
        galat={galatHapus}
        onBatal={() => setAkanHapus(null)}
        onKonfirmasi={() => void konfirmasiHapus()}
      />
    </div>
  )
}
