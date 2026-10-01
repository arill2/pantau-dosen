import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buka, pastikanSiap } from '@/lib/api'
import { KUNCI_QUERY } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import type {
  AuditLog,
  PenugasanLengkap,
  Profile,
  StatusPertemuan,
} from '@/lib/types'

const SELECT_PENUGASAN = `
  id,
  metode,
  dosen:dosen_id ( id, nama, nidn ),
  mata_kuliah:mata_kuliah_id ( id, kode, nama, sks ),
  periode:periode_id ( id, nama ),
  pertemuan ( id, penugasan_id, minggu_ke, tanggal, status, catatan, updated_at )
`

export function usePenugasanLengkap() {
  return useQuery({
    queryKey: KUNCI_QUERY.rekap,
    queryFn: async (): Promise<PenugasanLengkap[]> => {
      pastikanSiap()
      const hasil = await supabase
        .from('penugasan')
        .select(SELECT_PENUGASAN)
        .order('created_at', { ascending: false })
      const data = buka(hasil) as unknown as PenugasanLengkap[]
      return data.map((p) => ({
        ...p,
        pertemuan: [...(p.pertemuan ?? [])].sort(
          (a, b) => a.minggu_ke - b.minggu_ke,
        ),
      }))
    },
  })
}

export function useSimpanPenugasan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id?: string
      dosen_id: string
      mata_kuliah_id: string
      periode_id: string
      metode: 'T' | 'P'
    }) => {
      pastikanSiap()
      const { id, ...nilai } = input
      const hasil = id
        ? await supabase
            .from('penugasan')
            .update(nilai)
            .eq('id', id)
            .select()
            .single()
        : await supabase.from('penugasan').insert(nilai).select().single()
      return buka(hasil)
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.rekap }),
  })
}

export function useHapusPenugasan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      pastikanSiap()
      const hasil = await supabase.from('penugasan').delete().eq('id', id)
      if (hasil.error) buka(hasil)
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.rekap }),
  })
}

export interface InputPertemuan {
  penugasanId: string
  mingguKe: number
  tanggal: string | null
  status: StatusPertemuan
  catatan: string | null
}

export function useAuditLog(limit = 25) {
  return useQuery({
    queryKey: KUNCI_QUERY.audit,
    queryFn: async (): Promise<AuditLog[]> => {
      pastikanSiap()
      const hasil = await supabase
        .from('audit_log')
        .select('*')
        .order('waktu', { ascending: false })
        .limit(limit)
      return buka(hasil) as AuditLog[]
    },
  })
}

export function useSimpanProfil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; nama: string }) => {
      pastikanSiap()
      const hasil = await supabase
        .from('profiles')
        .update({ nama: input.nama })
        .eq('id', input.id)
        .select()
        .single()
      return buka(hasil) as Profile
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: KUNCI_QUERY.profil }),
  })
}

export function useSimpanPertemuan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InputPertemuan) => {
      pastikanSiap()
      const hasil = await supabase
        .from('pertemuan')
        .upsert(
          {
            penugasan_id: input.penugasanId,
            minggu_ke: input.mingguKe,
            tanggal: input.tanggal,
            status: input.status,
            catatan: input.catatan,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'penugasan_id,minggu_ke' },
        )
        .select()
        .single()
      return buka(hasil)
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.rekap }),
  })
}
