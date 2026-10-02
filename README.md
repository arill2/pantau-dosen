# Pantau Dosen

Aplikasi web internal untuk **rekap monitoring pembelajaran taruna**. Admin mencatat
kehadiran dosen per pertemuan (pekan 1 sampai 16) untuk tiap mata kuliah, memfilter
rekap per bulan, lalu mengekspor laporan ke Excel atau PDF.

Dibangun mengikuti PRD `PRD_ Rekap Monitoring Pembelajaran Taruna.md`, dengan arah
desain pada `DESIGN.md`.

## Fitur

- Autentikasi admin (email/kata sandi Supabase) dengan proteksi seluruh halaman.
- Master data: Dosen (dengan kode), Mata Kuliah (SKS Teori/Praktik), Kelas (program, semester, angkatan, paralel), Periode, dan Penugasan (dosen + mata kuliah + kelas + metode + periode).
- Input pertemuan 1 sampai 16 per penugasan: status, tanggal pelaksanaan, catatan.
- Tabel rekap dengan kolom 16 pekan, persentase, dan total kehadiran yang dihitung otomatis.
- Tampilan **Per bulan**: persentase & total kehadiran tiap bulan sekaligus.
- Filter periode, bulan, dosen, mata kuliah, kelas, dan metode; pencarian dan pengurutan.
- Penanda visual untuk persentase di bawah ambang batas.
- Ekspor Excel (.xlsx) dan PDF (landscape) sesuai filter aktif.
- Audit log perubahan pertemuan (siapa, kapan, nilai lama dan baru).
- **Laporan Ketua Kelas**: ketua kelas melaporkan kehadiran dosen lewat halaman publik `/lapor` dengan memilih kelas (tanpa kode); masuk ke log admin (siapa, kelas mana, kapan) dengan verifikasi, **edit sebelum disetujui**, tombol "Terima/Tolak", dan "Terapkan ke rekap". Duplikat pekan dicegah.
- Filter/grup status kehadiran di dashboard admin: Hadir, Tidak hadir, Izin, Pengganti (chip berjumlah, bisa diklik).
- Tema terang dan gelap, tata letak responsif (desktop, tablet, dan ponsel).

## Teknologi

React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query,
Supabase (Postgres + Auth), SheetJS, jsPDF.

## Menjalankan

```bash
npm install
cp .env.example .env      # lalu isi kredensial Supabase
npm run dev
```

Bila `.env` belum diisi, aplikasi menampilkan halaman panduan setup, bukan error.

## Menyiapkan Supabase

1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu **Run**.
   Ini membuat tabel, RLS, trigger, dan audit log.
   Untuk mencoba dengan data contoh, jalankan juga `supabase/seed.example.sql`
   (hapus sebelum dipakai dengan data nyata).
   *Sudah pernah memasang versi lama?* Jalankan berurutan migrasi di
   `supabase/migrations/`: `0002_kelas.sql`, `0003_kode_sks_kelas.sql`,
   `0004_laporan.sql`, `0005_laporan_validasi.sql`, `0006_lapor_pilih_kelas.sql`,
   `0007_verifikasi.sql`, `0008_dokumentasi_opsional.sql`, `0009_tolak_bisa_ulang.sql`,
   `0010_admin_edit_laporan.sql`.
3. Buka **Project Settings > API**, salin **Project URL** dan **anon public key**
   ke `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_AUTH_EMAIL_DOMAIN=pantau-dosen.local
   VITE_APP_NAME=Pantau Dosen
   VITE_APP_SUBTITLE=Rekap pembelajaran taruna
   VITE_INSTANSI=Politeknik Ilmu Pelayaran Makassar
   ```
4. Buat admin pertama di **Authentication > Users > Add user**, email
   `admin@pantau-dosen.local` dan kata sandi pilihan Anda.

### Login dengan username

Form login menerima **username** atau **email**. Bila Anda mengetik `admin`
(tanpa karakter `@`), aplikasi mengubahnya menjadi `admin@pantau-dosen.local`
sesuai `VITE_AUTH_EMAIL_DOMAIN`. Jadi saat membuat user Supabase, gunakan email
dengan domain tersebut.

## Aturan perhitungan

Diatur di halaman **Pengaturan** dan tersimpan per perangkat:

- **Total kehadiran** = jumlah pertemuan berstatus Hadir pada filter aktif.
- **Persentase** = total kehadiran dibagi pembagi, dibulatkan 1 desimal.
- **Pembagi** dapat dipilih:
  - *Pertemuan terlaksana* (bawaan): status selain "Belum terlaksana".
  - *Pertemuan bertanggal*: pertemuan yang sudah punya tanggal.
  - *Selalu 16 pertemuan*.
- Status **Izin** dan **Pengganti** dapat ikut dihitung sebagai kehadiran (opsional).
- **Ambang batas** (bawaan 75%) menentukan kapan persentase ditandai.

## Skrip

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Type-check dan build produksi |
| `npm run preview` | Jalankan hasil build |
| `npm run lint` | Pemeriksaan lint (oxlint) |

## Struktur

```
src/
  components/        komponen UI dan tata letak
  contexts/          auth, tema, pengaturan perhitungan
  hooks/             query dan mutasi (TanStack Query + Supabase)
  lib/               supabase client, tipe, perhitungan, ekspor, format
  pages/             halaman per rute
supabase/
  schema.sql         skema database, RLS, trigger
  seed.example.sql   data contoh (opsional)
DESIGN.md            arah desain
```

## Catatan

- Satu peran saja (admin). Dosen dan taruna tidak login.
- Tabel pekan tampil penuh di desktop dengan kepala dan kolom pertama yang melekat;
  di ponsel, tiap penugasan menjadi kartu dengan strip pekan agar tidak menyulitkan.
- Perubahan data pertemuan dicatat otomatis oleh trigger database.
