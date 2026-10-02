-- ============================================================================
-- Migrasi 0007: Verifikasi laporan oleh admin + anti-absensi fiktif
-- - Laporan selalu masuk berstatus 'baru' (pending). TIDAK masuk rekap sampai
--   admin menerima.
-- - Dokumentasi (bukti) wajib diisi saat taruna mengirim.
-- - Catat siapa admin yang memverifikasi dan kapan, plus alasan penolakan.
-- ============================================================================

alter table public.laporan add column if not exists catatan_verifikasi text;
alter table public.laporan
  add column if not exists diverifikasi_oleh uuid references auth.users (id) on delete set null;
alter table public.laporan add column if not exists diverifikasi_pada timestamptz;

-- ---------------------------------------------------------------------------
-- Lapor (berbasis kode) - dokumentasi wajib
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
  select k.id into v_kelas from public.kelas k
  where k.kode_akses is not null
    and upper(trim(k.kode_akses)) = upper(trim(p_kode));

  if v_kelas is null then raise exception 'Kode kelas tidak valid'; end if;

  select m.nama, d.nama, p.metode into v_mk, v_dosen, v_tipe
  from public.penugasan p
  join public.dosen d on d.id = p.dosen_id
  join public.mata_kuliah m on m.id = p.mata_kuliah_id
  where p.id = p_penugasan and p.kelas_id = v_kelas;

  if v_mk is null then raise exception 'Mata kuliah tidak cocok dengan kelas'; end if;
  if p_nama_ketua is null or length(trim(p_nama_ketua)) = 0 then
    raise exception 'Nama ketua kelas wajib diisi';
  end if;
  if p_minggu is null or p_minggu < 1 or p_minggu > 16 then
    raise exception 'Minggu pertemuan harus antara 1 sampai 16';
  end if;
  if p_tanggal is null then raise exception 'Tanggal pembelajaran wajib diisi'; end if;
  if p_dokumentasi is null or length(trim(p_dokumentasi)) = 0 then
    raise exception 'Dokumentasi wajib diisi sebagai bukti';
  end if;

  if exists (
    select 1 from public.laporan
    where kelas_id = v_kelas and penugasan_id = p_penugasan and minggu_ke = p_minggu
  ) then
    raise exception 'Pekan ini sudah dilaporkan (pekan %)', p_minggu using errcode = '23505';
  end if;

  insert into public.laporan (
    kelas_id, penugasan_id, nama_ketua, mata_kuliah, nama_dosen, tipe,
    minggu_ke, tanggal, waktu, dosen_hadir, catatan, dokumentasi_url, status
  ) values (
    v_kelas, p_penugasan, trim(p_nama_ketua), v_mk, v_dosen, v_tipe,
    p_minggu, p_tanggal, p_waktu, p_dosen_hadir,
    nullif(trim(coalesce(p_catatan, '')), ''),
    trim(p_dokumentasi), 'baru'
  ) returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lapor (berbasis kelas) - dokumentasi wajib
-- ---------------------------------------------------------------------------
create or replace function public.lapor_kirim_kelas(
  p_kelas uuid,
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
  v_mk text;
  v_dosen text;
  v_tipe text;
  v_id uuid;
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
    raise exception 'Nama ketua kelas wajib diisi';
  end if;
  if p_minggu is null or p_minggu < 1 or p_minggu > 16 then
    raise exception 'Minggu pertemuan harus antara 1 sampai 16';
  end if;
  if p_tanggal is null then raise exception 'Tanggal pembelajaran wajib diisi'; end if;
  if p_dokumentasi is null or length(trim(p_dokumentasi)) = 0 then
    raise exception 'Dokumentasi wajib diisi sebagai bukti';
  end if;

  if exists (
    select 1 from public.laporan
    where kelas_id = p_kelas and penugasan_id = p_penugasan and minggu_ke = p_minggu
  ) then
    raise exception 'Pekan ini sudah dilaporkan (pekan %)', p_minggu using errcode = '23505';
  end if;

  insert into public.laporan (
    kelas_id, penugasan_id, nama_ketua, mata_kuliah, nama_dosen, tipe,
    minggu_ke, tanggal, waktu, dosen_hadir, catatan, dokumentasi_url, status
  ) values (
    p_kelas, p_penugasan, trim(p_nama_ketua), v_mk, v_dosen, v_tipe,
    p_minggu, p_tanggal, p_waktu, p_dosen_hadir,
    nullif(trim(coalesce(p_catatan, '')), ''),
    trim(p_dokumentasi), 'baru'
  ) returning id into v_id;

  return v_id;
end;
$$;