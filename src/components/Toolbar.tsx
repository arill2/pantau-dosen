import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

interface Props {
  cari: string
  setCari: (v: string) => void
  placeholder: string
  jumlah: number
  labelJumlah: string
  children?: ReactNode
}

export function Toolbar({
  cari,
  setCari,
  placeholder,
  jumlah,
  labelJumlah,
  children,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:w-72 sm:flex-none">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="field pl-9"
          />
        </div>
        <p className="tnum hidden shrink-0 text-[13px] text-muted sm:block">
          {jumlah} {labelJumlah}
        </p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
