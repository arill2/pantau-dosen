-- Migrasi 0011: opsi Reschedule pada laporan ketua kelas.
alter table public.laporan
  add column if not exists reschedule boolean not null default false;

drop function if exists public.lapor_kirim_kelas(
  uuid, text, uuid, integer, date, time, boolean, text, text
);
drop function if exists public.lapor_admin_ubah(
  uuid, text, uuid, integer, date, time, boolean, text, text
);

create or replace function public.lapor_kirim_kelas(
  p_kelas uuid, p_nama_ketua text, p_penugasan uuid, p_minggu integer,
  p_tanggal date, p_waktu time, p_dosen_hadir boolean,
  p_reschedule boolean default false,
  p_catatan text default null, p_dokumentasi text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_mk text; v_dosen text; v_tipe text; v_id uuid;
begin
  if not exists (select 1 from public.kelas where id = p_kelas and aktif) then
    raise exception 'Kelas tidak ditemukan'; end if;
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
    minggu_ke, tanggal, waktu, dosen_hadir, reschedule, catatan, dokumentasi_url, status)
  values (p_kelas, p_penugasan, trim(p_nama_ketua), v_mk, v_dosen, v_tipe,
    p_minggu, p_tanggal, p_waktu,
    case when coalesce(p_reschedule, false) then false else p_dosen_hadir end,
    coalesce(p_reschedule, false),
    nullif(trim(coalesce(p_catatan, '')), ''),
    nullif(trim(coalesce(p_dokumentasi, '')), ''), 'baru')
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.lapor_kirim_kelas(
  uuid, text, uuid, integer, date, time, boolean, boolean, text, text
) to anon, authenticated;

create or replace function public.lapor_admin_ubah(
  p_id uuid, p_nama_ketua text, p_penugasan uuid, p_minggu integer,
  p_tanggal date, p_waktu time, p_dosen_hadir boolean,
  p_reschedule boolean default false,
  p_catatan text default null, p_dokumentasi text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare v_kelas uuid; v_status text; v_mk text; v_dosen text; v_tipe text;
begin
  if auth.uid() is null then raise exception 'Harus masuk sebagai admin'; end if;
  select kelas_id, status into v_kelas, v_status from public.laporan where id = p_id;
  if v_kelas is null then raise exception 'Laporan tidak ditemukan'; end if;
  if v_status <> 'baru' then
    raise exception 'Laporan yang sudah diputus tidak dapat diubah'; end if;
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
  if exists (select 1 from public.laporan
    where kelas_id = v_kelas and penugasan_id = p_penugasan
      and minggu_ke = p_minggu and status <> 'ditolak' and id <> p_id) then
    raise exception 'Pekan ini sudah dilaporkan untuk mata kuliah tersebut (data ganda)'
      using errcode = '23505';
  end if;
  update public.laporan set
    nama_ketua = trim(p_nama_ketua), penugasan_id = p_penugasan,
    mata_kuliah = v_mk, nama_dosen = v_dosen, tipe = v_tipe,
    minggu_ke = p_minggu, tanggal = p_tanggal, waktu = p_waktu,
    dosen_hadir = case when coalesce(p_reschedule, false) then false else p_dosen_hadir end,
    reschedule = coalesce(p_reschedule, false),
    catatan = nullif(trim(coalesce(p_catatan, '')), ''),
    dokumentasi_url = nullif(trim(coalesce(p_dokumentasi, '')), '')
  where id = p_id;
end;
$$;

grant execute on function public.lapor_admin_ubah(
  uuid, text, uuid, integer, date, time, boolean, boolean, text, text
) to authenticated;
