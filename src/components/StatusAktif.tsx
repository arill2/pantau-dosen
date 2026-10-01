export function StatusAktif({ aktif }: { aktif: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
        aktif ? 'bg-hadir-soft text-hadir' : 'bg-belum-soft text-belum'
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${aktif ? 'bg-hadir' : 'bg-belum'}`}
      />
      {aktif ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}
