-- ============================================================================
-- DATA CONTOH (opsional)
-- Hanya untuk mencoba aplikasi. Jangan dipakai di produksi.
-- Hapus data ini sebelum memakai sistem dengan data sebenarnya:
--   truncate public.pertemuan, public.penugasan, public.mata_kuliah,
--            public.dosen, public.periode restart identity cascade;
-- ============================================================================

insert into public.periode (nama, tgl_mulai, tgl_selesai, aktif)
values ('2026/2027 Ganjil', '2026-09-01', '2027-01-31', true);

insert into public.dosen (nama, nidn, aktif)
values
  ('Dosen Contoh A', '0000000001', true),
  ('Dosen Contoh B', '0000000002', true);

insert into public.mata_kuliah (kode, nama, sks, metode_default, aktif)
values
  ('CONTOH1', 'Mata Kuliah Contoh Teori', 3, 'T', true),
  ('CONTOH2', 'Mata Kuliah Contoh Praktik', 2, 'P', true);

insert into public.penugasan (dosen_id, mata_kuliah_id, periode_id, metode)
select d.id, m.id, p.id, m.metode_default
from public.dosen d
cross join public.mata_kuliah m
cross join public.periode p
where p.aktif
  and d.nidn in ('0000000001', '0000000002')
  and m.kode in ('CONTOH1', 'CONTOH2');

-- Buat 16 pertemuan berstatus "belum" untuk tiap penugasan.
insert into public.pertemuan (penugasan_id, minggu_ke, status)
select pen.id, g, 'belum'
from public.penugasan pen
cross join generate_series(1, 16) as g
on conflict (penugasan_id, minggu_ke) do nothing;
