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
  kode text,
  nidn text,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists dosen_kode_unik on public.dosen (kode);

create table if not exists public.mata_kuliah (
  id uuid primary key default gen_random_uuid(),
  kode text not null check (length(trim(kode)) > 0),
  nama text not null check (length(trim(nama)) > 0),
  sks integer not null default 2 check (sks between 1 and 8),
  sks_t integer not null default 0,
  sks_p integer not null default 0,
  metode_default text not null default 'T' check (metode_default in ('T', 'P')),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists mata_kuliah_kode_unik on public.mata_kuliah (kode);

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
  program text,
  semester text,
  angkatan text,
  paralel text,
  kode_akses text,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists kelas_kunci_unik
  on public.kelas (program, semester, angkatan, paralel);
create unique index if not exists kelas_kode_akses_unik on public.kelas (kode_akses);

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

-- ===========================================================================
-- Laporan Ketua Kelas (lihat juga supabase/migrations/0004_laporan.sql)
-- ===========================================================================
create table if not exists public.laporan (
  id uuid primary key default gen_random_uuid(),
  kelas_id uuid not null references public.kelas (id) on delete cascade,
  penugasan_id uuid references public.penugasan (id) on delete set null,
  nama_ketua text not null check (length(trim(nama_ketua)) > 0),
  mata_kuliah text,
  nama_dosen text,
  tipe text check (tipe in ('T', 'P')),
  minggu_ke integer check (minggu_ke between 1 and 16),
  tanggal date,
  waktu time,
  dosen_hadir boolean not null,
  catatan text,
  dokumentasi_url text,
  status text not null default 'baru'
    check (status in ('baru', 'terverifikasi', 'ditolak')),
  catatan_verifikasi text,
  diverifikasi_oleh uuid references auth.users (id) on delete set null,
  diverifikasi_pada timestamptz,
  dibuat_pada timestamptz not null default now()
);

create index if not exists laporan_kelas_idx on public.laporan (kelas_id);
create index if not exists laporan_dibuat_idx on public.laporan (dibuat_pada desc);

alter table public.laporan enable row level security;

drop policy if exists laporan_admin on public.laporan;
create policy laporan_admin on public.laporan
  for all to authenticated using (true) with check (true);

revoke all on public.laporan from anon;

create or replace function public.lapor_daftar(p_kode text)
returns table (
  penugasan_id uuid,
  mata_kuliah text,
  kode_mk text,
  nama_dosen text,
  metode text,
  kelas_nama text
)
language sql
security definer
set search_path = public
as $$
  select p.id, m.nama, m.kode, d.nama, p.metode, k.nama
  from public.penugasan p
  join public.kelas k on k.id = p.kelas_id
  join public.dosen d on d.id = p.dosen_id
  join public.mata_kuliah m on m.id = p.mata_kuliah_id
  where k.kode_akses is not null
    and upper(trim(k.kode_akses)) = upper(trim(p_kode))
  order by m.nama, p.metode;
$$;

create or replace function public.lapor_kirim(
  p_kode text,
  p_nama_ketua text,
  p_penugasan uuid,
  p_minggu integer,
  p_tanggal date,
  p_waktu time,
  p_dosen_hadir boolean,
  p_catatan text default null,
  p_dokumentasi text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kelas uuid;
  v_mk text;
  v_dosen text;
  v_tipe text;
  v_id uuid;
begin
  select k.id into v_kelas
  from public.kelas k
  where k.kode_akses is not null
    and upper(trim(k.kode_akses)) = upper(trim(p_kode));

  if v_kelas is null then
    raise exception 'Kode kelas tidak valid';
  end if;

  select m.nama, d.nama, p.metode
    into v_mk, v_dosen, v_tipe
  from public.penugasan p
  join public.dosen d on d.id = p.dosen_id
  join public.mata_kuliah m on m.id = p.mata_kuliah_id
  where p.id = p_penugasan and p.kelas_id = v_kelas;

  if v_mk is null then
    raise exception 'Mata kuliah tidak cocok dengan kelas';
  end if;

  if p_nama_ketua is null or length(trim(p_nama_ketua)) = 0 then
    raise exception 'Nama ketua kelas wajib diisi';
  end if;

  insert into public.laporan (
    kelas_id, penugasan_id, nama_ketua, mata_kuliah, nama_dosen, tipe,
    minggu_ke, tanggal, waktu, dosen_hadir, catatan, dokumentasi_url
  ) values (
    v_kelas, p_penugasan, trim(p_nama_ketua), v_mk, v_dosen, v_tipe,
    p_minggu, p_tanggal, p_waktu, p_dosen_hadir,
    nullif(trim(coalesce(p_catatan, '')), ''),
    nullif(trim(coalesce(p_dokumentasi, '')), '')
  ) returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.lapor_daftar(text) to anon, authenticated;
grant execute on function public.lapor_kirim(
  text, text, uuid, integer, date, time, boolean, text, text
) to anon, authenticated;

-- RPC publik berbasis kelas (dashboard taruna tanpa kode) -------------------
create or replace function public.lapor_kelas()
returns table (id uuid, nama text, program text, semester text, angkatan text, paralel text)
language sql security definer set search_path = public as $$
  select k.id, k.nama, k.program, k.semester, k.angkatan, k.paralel
  from public.kelas k where k.aktif
  order by k.program nulls last, k.semester nulls last, k.angkatan nulls last, k.paralel nulls last;
$$;

create or replace function public.lapor_daftar_kelas(p_kelas uuid)
returns table (penugasan_id uuid, mata_kuliah text, kode_mk text, nama_dosen text, metode text, kelas_nama text)
language sql security definer set search_path = public as $$
  select p.id, m.nama, m.kode, d.nama, p.metode, k.nama
  from public.penugasan p
  join public.kelas k on k.id = p.kelas_id
  join public.dosen d on d.id = p.dosen_id
  join public.mata_kuliah m on m.id = p.mata_kuliah_id
  where p.kelas_id = p_kelas
  order by m.nama, p.metode;
$$;

create or replace function public.lapor_pekan_terisi_kelas(p_kelas uuid, p_penugasan uuid)
returns integer[]
language sql security definer set search_path = public as $$
  select coalesce(array_agg(l.minggu_ke order by l.minggu_ke), '{}')
  from public.laporan l
  where l.kelas_id = p_kelas and l.penugasan_id = p_penugasan and l.minggu_ke is not null
    and l.status <> 'ditolak';
$$;

create or replace function public.lapor_kirim_kelas(
  p_kelas uuid, p_nama_ketua text, p_penugasan uuid, p_minggu integer,
  p_tanggal date, p_waktu time, p_dosen_hadir boolean,
  p_catatan text default null, p_dokumentasi text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_mk text; v_dosen text; v_tipe text; v_id uuid;
begin
  if not exists (select 1 from public.kelas where id = p_kelas and aktif) then
    raise exception 'Kelas tidak ditemukan';
  end if;
  select m.nama, d.nama, p.metode into v_mk, v_dosen, v_tipe
  from public.penugasan p
  join public.dosen d on d.id = p.dosen_id
  join public.mata_kuliah m on m.id = p.mata_kuliah_id
  where p.id = p_penugasan and p.kelas_id = p_kelas;
  if v_mk is null then raise exception 'Mata kuliah tidak cocok dengan kelas'; end if;
  if p_nama_ketua is null or length(trim(p_nama_ketua)) = 0 then
    raise exception 'Nama ketua kelas wajib diisi'; end if;
  if p_minggu is null or p_minggu < 1 or p_minggu > 16 then
    raise exception 'Minggu pertemuan harus antara 1 sampai 16'; end if;
  if p_tanggal is null then raise exception 'Tanggal pembelajaran wajib diisi'; end if;
  if exists (select 1 from public.laporan where kelas_id = p_kelas
    and penugasan_id = p_penugasan and minggu_ke = p_minggu
    and status <> 'ditolak') then
    raise exception 'Pekan ini sudah dilaporkan (pekan %)', p_minggu using errcode = '23505';
  end if;
  insert into public.laporan (kelas_id, penugasan_id, nama_ketua, mata_kuliah, nama_dosen, tipe,
    minggu_ke, tanggal, waktu, dosen_hadir, catatan, dokumentasi_url, status)
  values (p_kelas, p_penugasan, trim(p_nama_ketua), v_mk, v_dosen, v_tipe,
    p_minggu, p_tanggal, p_waktu, p_dosen_hadir,
    nullif(trim(coalesce(p_catatan, '')), ''),
    nullif(trim(coalesce(p_dokumentasi, '')), ''), 'baru')
  returning id into v_id;
  return v_id;
end;
$$;

create unique index if not exists laporan_unik
  on public.laporan (kelas_id, penugasan_id, minggu_ke)
  where penugasan_id is not null and minggu_ke is not null and status <> 'ditolak';

grant execute on function public.lapor_kelas() to anon, authenticated;
grant execute on function public.lapor_daftar_kelas(uuid) to anon, authenticated;
grant execute on function public.lapor_pekan_terisi_kelas(uuid, uuid) to anon, authenticated;
grant execute on function public.lapor_kirim_kelas(
  uuid, text, uuid, integer, date, time, boolean, text, text
) to anon, authenticated;

-- Admin mengubah laporan ketua kelas sebelum disetujui --------------------
create or replace function public.lapor_admin_ubah(
  p_id uuid, p_nama_ketua text, p_penugasan uuid, p_minggu integer,
  p_tanggal date, p_waktu time, p_dosen_hadir boolean,
  p_catatan text default null, p_dokumentasi text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare v_kelas uuid; v_status text; v_mk text; v_dosen text; v_tipe text;
begin
  if auth.uid() is null then raise exception 'Harus masuk sebagai admin'; end if;
  select kelas_id, status into v_kelas, v_status from public.laporan where id = p_id;
  if v_kelas is null then raise exception 'Laporan tidak ditemukan'; end if;
  if v_status <> 'baru' then raise exception 'Laporan yang sudah diputus tidak dapat diubah'; end if;
  if p_nama_ketua is null or length(trim(p_nama_ketua)) = 0 then
    raise exception 'Nama ketua kelas wajib diisi'; end if;
  if p_minggu is null or p_minggu < 1 or p_minggu > 16 then
    raise exception 'Minggu pertemuan harus antara 1 sampai 16'; end if;
  if p_tanggal is null then raise exception 'Tanggal pembelajaran wajib diisi'; end if;
  select m.nama, d.nama, p.metode into v_mk, v_dosen, v_tipe
  from public.penugasan p
  join public.dosen d on d.id = p.dosen_id
  join public.mata_kuliah m on m.id = p.mata_kuliah_id
  where p.id = p_penugasan and p.kelas_id = v_kelas;
  if v_mk is null then raise exception 'Mata kuliah tidak cocok dengan kelas'; end if;
  if exists (select 1 from public.laporan where kelas_id = v_kelas
    and penugasan_id = p_penugasan and minggu_ke = p_minggu
    and status <> 'ditolak' and id <> p_id) then
    raise exception 'Pekan ini sudah dilaporkan untuk mata kuliah tersebut (data ganda)'
      using errcode = '23505';
  end if;
  update public.laporan set nama_ketua = trim(p_nama_ketua), penugasan_id = p_penugasan,
    mata_kuliah = v_mk, nama_dosen = v_dosen, tipe = v_tipe, minggu_ke = p_minggu,
    tanggal = p_tanggal, waktu = p_waktu, dosen_hadir = p_dosen_hadir,
    catatan = nullif(trim(coalesce(p_catatan, '')), ''),
    dokumentasi_url = nullif(trim(coalesce(p_dokumentasi, '')), '')
  where id = p_id;
end;
$$;

grant execute on function public.lapor_admin_ubah(
  uuid, text, uuid, integer, date, time, boolean, text, text
) to authenticated;
