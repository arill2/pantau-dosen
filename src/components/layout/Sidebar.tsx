import {
  BookOpen,
  CalendarRange,
  ClipboardList,
  DoorOpen,
  Inbox,
  ListChecks,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { APP_NAME, APP_SUBTITLE } from '@/lib/config'

interface Item {
  ke: string
  label: string
  ikon: LucideIcon
  akhir?: boolean
}

interface Grup {
  judul: string
  item: Item[]
}

export const NAVIGASI: Grup[] = [
  {
    judul: 'Monitor',
    item: [
      { ke: '/', label: 'Dashboard Rekap', ikon: ListChecks, akhir: true },
      { ke: '/laporan', label: 'Laporan Ketua Kelas', ikon: Inbox },
    ],
  },
  {
    judul: 'Master data',
    item: [
      { ke: '/dosen', label: 'Dosen', ikon: Users },
      { ke: '/mata-kuliah', label: 'Mata kuliah', ikon: BookOpen },
      { ke: '/kelas', label: 'Kelas', ikon: DoorOpen },
      { ke: '/periode', label: 'Periode', ikon: CalendarRange },
      { ke: '/penugasan', label: 'Penugasan', ikon: ClipboardList },
    ],
  },
  {
    judul: 'Akun',
    item: [{ ke: '/pengaturan', label: 'Pengaturan', ikon: Settings }],
  },
]

function Kelas({ aktif }: { aktif: boolean }) {
  return `group flex min-h-11 items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-sm font-medium transition-colors duration-150 ease-out lg:min-h-9 ${
    aktif
      ? 'bg-brand-soft text-brand-strong font-semibold'
      : 'text-muted hover:bg-surface-2 hover:text-ink'
  }`
}

export function Navigasi({ onPilih }: { onPilih?: () => void }) {
  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-5">
      {NAVIGASI.map((grup) => (
        <div key={grup.judul} className="flex flex-col gap-1">
          <p className="px-2.5 text-[11px] font-bold tracking-[0.06em] text-muted uppercase">
            {grup.judul}
          </p>
          {grup.item.map((item) => {
            const Ikon = item.ikon
            return (
              <NavLink
                key={item.ke}
                to={item.ke}
                end={item.akhir}
                onClick={onPilih}
                className={({ isActive }) => Kelas({ aktif: isActive })}
              >
                {({ isActive }) => (
                  <>
                    <Ikon
                      className={`size-[18px] shrink-0 ${isActive ? 'text-brand' : ''}`}
                      aria-hidden="true"
                      strokeWidth={2}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-[8px] bg-brand text-on-brand"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path
            d="M4 6h7M4 12h7M4 18h7M15 6h5M15 12h3M15 18h5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <div className="leading-tight">
        <p className="text-sm font-extrabold tracking-tight text-ink">{APP_NAME}</p>
        <p className="text-[11px] text-muted">{APP_SUBTITLE}</p>
      </div>
    </div>
  )
}
