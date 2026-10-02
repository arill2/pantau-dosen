-- ============================================================================
-- Migrasi 0006: Taruna pilih kelas dari daftar (tanpa kode)
-- Menyediakan RPC publik berbasis kelas (uuid) untuk dashboard taruna:
--   lapor_kelas()            -> daftar kelas
--   lapor_daftar_kelas(id)   -> mata kuliah/dosen per kelas
--   lapor_pekan_terisi_kelas(id, penugasan) -> pekan yang sudah dilapor
--   lapor_kirim_kelas(...)   -> kirim laporan
-- ============================================================================

create or replace function public.lapor_kelas()
returns table (
  id uuid,
  nama text,
  program text,
  semester text,
  angkatan text,
  paralel text
)
language sql
security definer
set search_path = public
as $$
  select k.id, k.nama, k.program, k.semester, k.angkatan, k.paralel
  from public.kelas k
  where k.aktif
  order by k.program nulls last, k.semester nulls last, k.angkatan nulls last, k.paralel nulls last;
$$;

create or replace function public.lapor_daftar_kelas(p_kelas uuid)
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
  where p.kelas_id = p_kelas
  order by m.nama, p.metode;
$$;

create or replace function public.lapor_pekan_terisi_kelas(
  p_kelas uuid,
  p_penugasan uuid
)
returns integer[]
language sql
security definer
set search_path = public
as $$
  select coalesce(array_agg(l.minggu_ke order by l.minggu_ke), '{}')
  from public.laporan l
  where l.kelas_id = p_kelas
    and l.penugasan_id = p_penugasan
    and l.minggu_ke is not null;
$$;

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

  select m.nama, d.nama, p.metode
    into v_mk, v_dosen, v_tipe
  from public.penugasan p
  join public.dosen d on d.id = p.dosen_id
  join public.mata_kuliah m on m.id = p.mata_kuliah_id
  where p.id = p_penugasan and p.kelas_id = p_kelas;

  if v_mk is null then
    raise exception 'Mata kuliah tidak cocok dengan kelas';
  end if;

  if p_nama_ketua is null or length(trim(p_nama_ketua)) = 0 then
    raise exception 'Nama ketua kelas wajib diisi';
  end if;

  if p_minggu is null or p_minggu < 1 or p_minggu > 16 then
    raise exception 'Minggu pertemuan harus antara 1 sampai 16';
  end if;

  if p_tanggal is null then
    raise exception 'Tanggal pembelajaran wajib diisi';
  end if;

  if exists (
    select 1 from public.laporan
    where kelas_id = p_kelas
      and penugasan_id = p_penugasan
      and minggu_ke = p_minggu
  ) then
    raise exception 'Pekan ini sudah dilaporkan (pekan %)', p_minggu
      using errcode = '23505';
  end if;

  insert into public.laporan (
    kelas_id, penugasan_id, nama_ketua, mata_kuliah, nama_dosen, tipe,
    minggu_ke, tanggal, waktu, dosen_hadir, catatan, dokumentasi_url
  ) values (
    p_kelas, p_penugasan, trim(p_nama_ketua), v_mk, v_dosen, v_tipe,
    p_minggu, p_tanggal, p_waktu, p_dosen_hadir,
    nullif(trim(coalesce(p_catatan, '')), ''),
    nullif(trim(coalesce(p_dokumentasi, '')), '')
  ) returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.lapor_kelas() to anon, authenticated;
grant execute on function public.lapor_daftar_kelas(uuid) to anon, authenticated;
grant execute on function public.lapor_pekan_terisi_kelas(uuid, uuid) to anon, authenticated;
grant execute on function public.lapor_kirim_kelas(
  uuid, text, uuid, integer, date, time, boolean, text, text
) to anon, authenticated;