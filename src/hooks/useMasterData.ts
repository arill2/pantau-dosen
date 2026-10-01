import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buka, pastikanSiap } from '@/lib/api'
import { KUNCI_QUERY } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import type { Dosen, MataKuliah, Periode } from '@/lib/types'

type Tabel = 'dosen' | 'mata_kuliah' | 'periode'

function kunciUntuk(tabel: Tabel) {
  if (tabel === 'dosen') return KUNCI_QUERY.dosen
  if (tabel === 'mata_kuliah') return KUNCI_QUERY.mataKuliah
  return KUNCI_QUERY.periode
}

function useDaftar<T>(tabel: Tabel, urut: string) {
  return useQuery({
    queryKey: kunciUntuk(tabel),
    enabled: true,
    queryFn: async (): Promise<T[]> => {
      pastikanSiap()
      const hasil = await supabase.from(tabel).select('*').order(urut, {
        ascending: true,
      })
      return buka(hasil) as T[]
    },
  })
}

export function useDosen() {
  return useDaftar<Dosen>('dosen', 'nama')
}

export function useMataKuliah() {
  return useDaftar<MataKuliah>('mata_kuliah', 'kode')
}

export function usePeriode() {
  return useDaftar<Periode>('periode', 'tgl_mulai')
}

function useSimpanMutasi(tabel: Tabel) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      pastikanSiap()
      const { id, ...nilai } = input as { id?: string } & Record<string, unknown>
      const hasil = id
        ? await supabase.from(tabel).update(nilai).eq('id', id).select().single()
        : await supabase.from(tabel).insert(nilai).select().single()
      return buka(hasil)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: kunciUntuk(tabel) })
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.rekap })
    },
  })
}

function useHapusMutasi(tabel: Tabel) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      pastikanSiap()
      const hasil = await supabase.from(tabel).delete().eq('id', id)
      if (hasil.error) buka(hasil)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: kunciUntuk(tabel) })
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.rekap })
    },
  })
}

/** Pastikan hanya satu periode aktif: matikan periode aktif lainnya. */
export function useNonaktifkanPeriodeLain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (kecualiId: string | null) => {
      pastikanSiap()
      let q = supabase.from('periode').update({ aktif: false }).eq('aktif', true)
      if (kecualiId) q = q.neq('id', kecualiId)
      const hasil = await q
      if (hasil.error) buka(hasil)
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: KUNCI_QUERY.periode }),
  })
}

export const useSimpanDosen = () => useSimpanMutasi('dosen')
export const useHapusDosen = () => useHapusMutasi('dosen')
export const useSimpanMataKuliah = () => useSimpanMutasi('mata_kuliah')
export const useHapusMataKuliah = () => useHapusMutasi('mata_kuliah')
export const useSimpanPeriode = () => useSimpanMutasi('periode')
export const useHapusPeriode = () => useHapusMutasi('periode')
