import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const KUNCI_QUERY = {
  dosen: ['dosen'] as const,
  mataKuliah: ['mata-kuliah'] as const,
  periode: ['periode'] as const,
  kelas: ['kelas'] as const,
  penugasan: ['penugasan'] as const,
  rekap: ['rekap'] as const,
  laporan: ['laporan'] as const,
  profil: ['profil'] as const,
  audit: ['audit'] as const,
}
