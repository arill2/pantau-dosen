-- ============================================================================
-- Ganti/pasang nama kelas sesuai template: N 1 A s/d N 1 O (15 kelas)
-- Jalankan di Supabase SQL Editor.
-- ============================================================================

-- 1) Hapus kelas contoh lama (opsional, aktifkan bila perlu):
-- delete from public.kelas where nama like 'Contoh%' or nama like 'Kelas 1%';

-- 2) Pastikan 15 kelas template ada
insert into public.kelas (nama, keterangan, aktif)
values
  ('N 1 A', 'Poltekbang', true),
  ('N 1 B', 'Poltekbang', true),
  ('N 1 C', 'Poltekbang', true),
  ('N 1 D', 'Poltekbang', true),
  ('N 1 E', 'Poltekbang', true),
  ('N 1 F', 'Poltekbang', true),
  ('N 1 G', 'Poltekbang', true),
  ('N 1 H', 'Poltekbang', true),
  ('N 1 I', 'Poltekbang', true),
  ('N 1 J', 'Poltekbang', true),
  ('N 1 K', 'Poltekbang', true),
  ('N 1 L', 'Poltekbang', true),
  ('N 1 M', 'Poltekbang', true),
  ('N 1 N', 'Poltekbang', true),
  ('N 1 O', 'Poltekbang', true)
on conflict (nama) do update
  set keterangan = excluded.keterangan,
      aktif = excluded.aktif;

-- 3) (Opsional) Perbarui nama kelas lama menjadi template, sesuaikan pemetaan:
-- update public.kelas set nama = 'N 1 A' where nama in ('Contoh 1A', 'Kelas 1A', '1A');
-- update public.kelas set nama = 'N 1 B' where nama in ('Contoh 1B', 'Kelas 1B', '1B');

-- 4) Verifikasi
select nama, aktif from public.kelas order by nama;
