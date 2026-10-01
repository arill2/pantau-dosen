import { useEffect, useState } from 'react'
import { Check, KeyRound, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { InlineError, TableSkeleton } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { usePengaturan } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuditLog, useSimpanProfil } from '@/hooks/useRekap'
import { DASAR_LABEL, type DasarPerhitungan } from '@/lib/attendance'
import { pesanError } from '@/lib/api'
import { formatTanggal } from '@/lib/format'

const AKSI_LABEL: Record<string, string> = {
  insert: 'Dibuat',
  update: 'Diubah',
  delete: 'Dihapus',
}

export function PengaturanPage() {
  const { profil, pengguna, segarkanProfil, ubahKataSandi } = useAuth()
  const simpanProfil = useSimpanProfil()
  const { aturan, simpanAturan, resetAturan } = usePengaturan()
  const { tema, setTema } = useTheme()
  const audit = useAuditLog()
  const { tampil } = useToast()

  const [nama, setNama] = useState('')
  const [galatNama, setGalatNama] = useState<string | null>(null)
  const [sandi, setSandi] = useState('')
  const [ulangi, setUlangi] = useState('')
  const [galatSandi, setGalatSandi] = useState<string | null>(null)
  const [memuatSandi, setMemuatSandi] = useState(false)

  useEffect(() => {
    setNama(profil?.nama ?? '')
  }, [profil?.nama])

  async function simpanNama() {
    if (!profil) return
    if (!nama.trim()) return setGalatNama('Nama tidak boleh kosong.')
    setGalatNama(null)
    try {
      await simpanProfil.mutateAsync({ id: profil.id, nama: nama.trim() })
      await segarkanProfil()
      tampil('Nama diperbarui.', 'sukses')
    } catch (err) {
      setGalatNama(pesanError(err))
    }
  }

  async function gantiSandi() {
    if (sandi.length < 8) return setGalatSandi('Kata sandi minimal 8 karakter.')
    if (sandi !== ulangi) return setGalatSandi('Ulangan kata sandi tidak sama.')
    setGalatSandi(null)
    setMemuatSandi(true)
    try {
      await ubahKataSandi(sandi)
      setSandi('')
      setUlangi('')
      tampil('Kata sandi berhasil diubah.', 'sukses')
    } catch (err) {
      setGalatSandi(pesanError(err))
    } finally {
      setMemuatSandi(false)
    }
  }

  const inisial = (profil?.nama || profil?.username || 'A').slice(0, 1).toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {/* Akun */}
      <section className="rounded-[10px] border border-line bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Akun admin</h2>
        <p className="mt-0.5 mb-4 text-[13px] text-muted">
          Identitas yang tampil pada riwayat perubahan.
        </p>

        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-brand text-base font-bold text-on-brand">
            {inisial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {profil?.nama || profil?.username || 'Admin'}
            </p>
            <p className="truncate text-[13px] text-muted">
              {pengguna?.email ?? '–'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {galatNama ? <InlineError pesan={galatNama} /> : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nama tampilan">
              {(p) => (
                <Input {...p} value={nama} onChange={(e) => setNama(e.target.value)} />
              )}
            </Field>
            <Field label="Username" petunjuk="Dipakai saat masuk. Tidak dapat diubah dari sini.">
              {(p) => (
                <Input {...p} value={profil?.username ?? ''} readOnly disabled />
              )}
            </Field>
          </div>
          <div>
            <Button
              variasi="utama"
              memuat={simpanProfil.isPending}
              onClick={() => void simpanNama()}
              ikon={<Check className="size-4" />}
            >
              Simpan nama
            </Button>
          </div>
        </div>
      </section>

      {/* Kata sandi */}
      <section className="rounded-[10px] border border-line bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Kata sandi</h2>
        <p className="mt-0.5 mb-4 text-[13px] text-muted">
          Minimal 8 karakter. Gunakan kombinasi yang tidak mudah ditebak.
        </p>
        <div className="flex flex-col gap-4">
          {galatSandi ? <InlineError pesan={galatSandi} /> : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Kata sandi baru">
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete="new-password"
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                  placeholder="••••••••"
                />
              )}
            </Field>
            <Field label="Ulangi kata sandi baru">
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete="new-password"
                  value={ulangi}
                  onChange={(e) => setUlangi(e.target.value)}
                  placeholder="••••••••"
                />
              )}
            </Field>
          </div>
          <div>
            <Button
              variasi="sekunder"
              memuat={memuatSandi}
              onClick={() => void gantiSandi()}
              ikon={<KeyRound className="size-4" />}
            >
              Ubah kata sandi
            </Button>
          </div>
        </div>
      </section>

      {/* Aturan perhitungan */}
      <section className="rounded-[10px] border border-line bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Aturan perhitungan</h2>
        <p className="mt-0.5 mb-4 text-[13px] text-muted">
          Sesuaikan dengan kebijakan institusi. Perubahan langsung dipakai pada rekap.
        </p>
        <div className="flex flex-col gap-4">
          <Field
            label="Pembagi persentase"
            petunjuk="Menentukan pertemuan mana yang masuk hitungan persen kehadiran."
          >
            {(p) => (
              <Select
                {...p}
                value={aturan.dasar}
                onChange={(e) =>
                  simpanAturan({ dasar: e.target.value as DasarPerhitungan })
                }
              >
                {Object.entries(DASAR_LABEL).map(([nilai, label]) => (
                  <option key={nilai} value={nilai}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <label className="flex min-h-11 items-start gap-2.5 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={aturan.hitungIzinSebagaiHadir}
              onChange={(e) =>
                simpanAturan({ hitungIzinSebagaiHadir: e.target.checked })
              }
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span>
              Hitung status <strong>Izin</strong> dan <strong>Pengganti</strong> sebagai
              kehadiran
            </span>
          </label>

          <div className="max-w-40">
            <Field label="Ambang batas (%)" petunjuk="Nilai di bawah ini ditandai merah.">
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={0}
                  max={100}
                  value={aturan.ambang}
                  onChange={(e) => simpanAturan({ ambang: Number(e.target.value) || 0 })}
                />
              )}
            </Field>
          </div>

          <div>
            <Button variasi="halus" onClick={resetAturan}>
              Kembalikan ke bawaan
            </Button>
          </div>
        </div>
      </section>

      {/* Tema */}
      <section className="rounded-[10px] border border-line bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Tampilan</h2>
        <p className="mt-0.5 mb-4 text-[13px] text-muted">
          Pilih tema kerja. Kedua tema diuji dengan kontras yang sama.
        </p>
        <div className="flex gap-2">
          <Button
            variasi={tema === 'light' ? 'utama' : 'sekunder'}
            onClick={() => setTema('light')}
            ikon={<Sun className="size-4" />}
            aria-pressed={tema === 'light'}
          >
            Terang
          </Button>
          <Button
            variasi={tema === 'dark' ? 'utama' : 'sekunder'}
            onClick={() => setTema('dark')}
            ikon={<Moon className="size-4" />}
            aria-pressed={tema === 'dark'}
          >
            Gelap
          </Button>
        </div>
      </section>

      {/* Riwayat */}
      <section className="rounded-[10px] border border-line bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Riwayat perubahan</h2>
        <p className="mt-0.5 mb-4 text-[13px] text-muted">
          25 perubahan terakhir pada data pertemuan.
        </p>
        {audit.isLoading ? (
          <TableSkeleton baris={4} />
        ) : audit.isError ? (
          <InlineError pesan="Riwayat tidak dapat dimuat." onCoba={() => void audit.refetch()} />
        ) : (audit.data?.length ?? 0) === 0 ? (
          <p className="rounded-[6px] border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-muted">
            Belum ada perubahan tercatat.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--line)]">
            {audit.data?.map((log) => {
              const bar = log.nilai_baru ?? log.nilai_lama
              const minggu = bar && typeof bar.minggu_ke === 'number' ? bar.minggu_ke : null
              const status = bar && typeof bar.status === 'string' ? bar.status : null
              return (
                <li key={log.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink">
                      {AKSI_LABEL[log.aksi] ?? log.aksi} pertemuan
                      {minggu ? ` pekan ${minggu}` : ''}
                      {status ? ` · ${status}` : ''}
                    </p>
                    <p className="tnum text-[11px] text-muted">
                      {new Date(log.waktu).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted">
                    {formatTanggal(log.waktu.slice(0, 10))}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
