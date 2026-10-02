-- ============================================================================
-- Pantau Dosen - Skema Database Supabase
-- Rekap Monitoring Pembelajaran Taruna
--
-- Cara pakai:
--   1. Buka Supabase Dashboard > SQL Editor > New query
--   2. Tempel seluruh isi file ini, lalu Run
--   3. Buat admin pertama di Authentication > Users > Add user
--      (email: admin@pantau-dosen.local, password: pilihan Anda)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabel master
-- ---------------------------------------------------------------------------
create table if not exists public.dosen (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (length(trim(nama)) > 0),
  nidn text,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mata_kuliah (
  id uuid primary key default gen_random_uuid(),
  kode text not null check (length(trim(kode)) > 0),
  nama text not null check (length(trim(nama)) > 0),
  sks integer not null default 2 check (sks between 1 and 8),
  metode_default text not null default 'T' check (metode_default in ('T', 'P')),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.periode (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (length(trim(nama)) > 0),
  tgl_mulai date not null,
  tgl_selesai date not null,
  aktif boolean not null default false,
  created_at timestamptz not null default now(),
  check (tgl_selesai >= tgl_mulai)
);

-- Hanya boleh ada satu periode aktif pada satu waktu.
create unique index if not exists periode_satu_aktif
  on public.periode (aktif)
  where aktif;

-- ---------------------------------------------------------------------------
-- Penugasan & pertemuan
-- ---------------------------------------------------------------------------
create table if not exists public.kelas (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (length(trim(nama)) > 0),
  keterangan text,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.penugasan (
  id uuid primary key default gen_random_uuid(),
  dosen_id uuid not null references public.dosen (id) on delete restrict,
  mata_kuliah_id uuid not null references public.mata_kuliah (id) on delete restrict,
  periode_id uuid not null references public.periode (id) on delete cascade,
  kelas_id uuid not null references public.kelas (id) on delete restrict,
  metode text not null check (metode in ('T', 'P')),
  created_at timestamptz not null default now(),
  unique (dosen_id, mata_kuliah_id, periode_id, metode, kelas_id)
);

create table if not exists public.pertemuan (
  id uuid primary key default gen_random_uuid(),
  penugasan_id uuid not null references public.penugasan (id) on delete cascade,
  minggu_ke integer not null check (minggu_ke between 1 and 16),
  tanggal date,
  status text not null default 'belum'
    check (status in ('hadir', 'tidak_hadir', 'belum', 'izin', 'pengganti')),
  catatan text,
  updated_at timestamptz not null default now(),
  unique (penugasan_id, minggu_ke)
);

create index if not exists pertemuan_penugasan_idx on public.pertemuan (penugasan_id);
create index if not exists pertemuan_tanggal_idx on public.pertemuan (tanggal);

-- ---------------------------------------------------------------------------
-- Profil admin (terhubung ke auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  nama text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id) on delete set null,
  aksi text not null,
  entitas text not null,
  entitas_id uuid,
  nilai_lama jsonb,
  nilai_baru jsonb,
  waktu timestamptz not null default now()
);

create index if not exists audit_log_waktu_idx on public.audit_log (waktu desc);

-- ---------------------------------------------------------------------------
-- Trigger: buat profil otomatis saat admin baru dibuat
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, nama)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'nama', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: catat perubahan pertemuan ke audit_log (FR-13)
-- ---------------------------------------------------------------------------
create or replace function public.log_pertemuan_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_lama jsonb;
  v_baru jsonb;
begin
  if TG_OP = 'DELETE' then
    v_id := old.id;
    v_lama := to_jsonb(old);
    v_baru := null;
  elsif TG_OP = 'UPDATE' then
    v_id := new.id;
    v_lama := to_jsonb(old);
    v_baru := to_jsonb(new);
  else
    v_id := new.id;
    v_lama := null;
    v_baru := to_jsonb(new);
  end if;

  insert into public.audit_log (actor, aksi, entitas, entitas_id, nilai_lama, nilai_baru)
  values (auth.uid(), lower(TG_OP), 'pertemuan', v_id, v_lama, v_baru);

  return null;
end;
$$;

drop trigger if exists pertemuan_audit on public.pertemuan;
create trigger pertemuan_audit
  after insert or update or delete on public.pertemuan
  for each row execute function public.log_pertemuan_change();

-- ---------------------------------------------------------------------------
-- Row Level Security: hanya admin terautentikasi yang boleh mengakses
-- ---------------------------------------------------------------------------
alter table public.dosen enable row level security;
alter table public.mata_kuliah enable row level security;
alter table public.periode enable row level security;
alter table public.kelas enable row level security;
alter table public.penugasan enable row level security;
alter table public.pertemuan enable row level security;
alter table public.audit_log enable row level security;
alter table public.profiles enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'dosen', 'mata_kuliah', 'periode', 'kelas', 'penugasan', 'pertemuan', 'audit_log'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_admin_all', t
    );
  end loop;
end $$;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all to authenticated
  using (true)
  with check (true);
