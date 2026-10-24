import type { ReactNode } from 'react'

export function NomorUrut({ nomor }: { nomor: number }) {
  return (
    <span className="tnum inline-grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-muted">
      {nomor}
    </span>
  )
}

export function DenganNomorUrut({
  nomor,
  children,
}: {
  nomor: number
  children: ReactNode
}) {
  return (
    <span className="flex items-center gap-2">
      <NomorUrut nomor={nomor} />
      {children}
    </span>
  )
}
