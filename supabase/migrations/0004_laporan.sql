-- ============================================================================
-- Migrasi 0004: Laporan Ketua Kelas
-- Ketua kelas (tanpa akun) melaporkan apakah dosen hadir, memakai kode akses
-- kelas. Laporan masuk ke DB admin sebagai log (siapa, kelas mana, kapan).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Kode akses per kelas (dibagikan ke ketua kelas)
-- ---------------------------------------------------------------------------
alter table public.kelas add column if not exists kode_akses text;
create unique index if not exists kelas_kode_akses_unik on public.kelas (kode_akses);

update public.kelas
set kode_akses = lower(
  regexp_replace(
    coalesce(program, '') || '-' || coalesce(semester, '') || '-' ||
    coalesce(paralel, '') || '-' || coalesce(angkatan, ''),
    '[^a-zA-Z0-9-]', '', 'g'
  )
)
where kode_akses is null and program is not null and paralel is not null;

-- ---------------------------------------------------------------------------
-- Tabel laporan
-- ---------------------------------------------------------------------------
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
  dibuat_pada timestamptz not null default now()
);

create index if not exists laporan_kelas_idx on public.laporan (kelas_id);
create index if not exists laporan_dibuat_idx on public.laporan (dibuat_pada desc);

alter table public.laporan enable row level security;

drop policy if exists laporan_admin on public.laporan;
create policy laporan_admin on public.laporan
  for all to authenticated using (true) with check (true);

-- Publik tidak menyentuh tabel langsung; hanya lewat RPC security definer.
revoke all on public.laporan from anon;

-- ---------------------------------------------------------------------------
-- RPC publik: daftar penugasan satu kelas (validasi kode akses)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- RPC publik: kirim laporan
-- ---------------------------------------------------------------------------
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