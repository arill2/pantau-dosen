-- ============================================================================
-- Migrasi 0003: Kolom tambahan untuk data PIP (kode & SKS T/P)
-- - dosen.kode        : kode singkatan dosen (mis. RDS)
-- - mata_kuliah.sks_t : SKS teori
-- - mata_kuliah.sks_p : SKS praktik
-- - kelas.program / semester / angkatan / paralel
-- ============================================================================

alter table public.dosen add column if not exists kode text;
create unique index if not exists dosen_kode_unik on public.dosen (kode);

alter table public.mata_kuliah add column if not exists sks_t integer not null default 0;
alter table public.mata_kuliah add column if not exists sks_p integer not null default 0;
create unique index if not exists mata_kuliah_kode_unik on public.mata_kuliah (kode);

alter table public.kelas add column if not exists program text;
alter table public.kelas add column if not exists semester text;
alter table public.kelas add column if not exists angkatan text;
alter table public.kelas add column if not exists paralel text;
create unique index if not exists kelas_kunci_unik
  on public.kelas (program, semester, angkatan, paralel);