/**
 * Konfigurasi branding aplikasi. Tidak ada nilai instansi yang di-hardcode di
 * komponen; semuanya dapat diatur lewat variabel lingkungan VITE_*.
 */
export const APP_NAME = import.meta.env.VITE_APP_NAME?.trim() || 'Pantau Dosen'

export const APP_SUBTITLE =
  import.meta.env.VITE_APP_SUBTITLE?.trim() || 'Rekap pembelajaran taruna'

export const INSTANSI =
  import.meta.env.VITE_INSTANSI?.trim() || 'Politeknik Ilmu Pelayaran Makassar'
