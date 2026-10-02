-- ============================================================================
-- Migrasi 0002: Master Kelas
-- Menambahkan entitas Kelas dan menghubungkannya ke penugasan, agar rekap
-- dapat menampilkan "kelas apa saja yang diajarkan".
--
-- Jalankan di Supabase > SQL Editor, atau otomatis bila memakai schema.sql baru.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabel master kelas
-- ---------------------------------------------------------------------------
create table if not exists public.kelas (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (length(trim(nama)) > 0),
  keterangan text,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Hubungkan kelas ke penugasan
-- ---------------------------------------------------------------------------
alter table public.penugasan
  add column if not exists kelas_id uuid references public.kelas (id) on delete restrict;

-- Data penugasan lama (bila ada) diberi kelas default sebelum NOT NULL dipasang.
insert into public.kelas (nama)
select 'Umum'
where exists (select 1 from public.penugasan where kelas_id is null)
  and not exists (select 1 from public.kelas where nama = 'Umum');

update public.penugasan
set kelas_id = (select id from public.kelas where nama = 'Umum' limit 1)
where kelas_id is null;

alter table public.penugasan alter column kelas_id set not null;

-- Keunikan kini menyertakan kelas: satu dosen boleh mengajar MK yang sama
-- pada kelas berbeda.
alter table public.penugasan
  drop constraint if exists penugasan_dosen_id_mata_kuliah_id_periode_id_metode_key;

create unique index if not exists penugasan_unik
  on public.penugasan (dosen_id, mata_kuliah_id, periode_id, metode, kelas_id);

create index if not exists penugasan_kelas_idx on public.penugasan (kelas_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.kelas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'kelas' and policyname = 'kelas_admin_all'
  ) then
    create policy kelas_admin_all on public.kelas
      for all to authenticated using (true) with check (true);
  end if;
end $$;