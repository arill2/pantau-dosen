# PRD: Rekap Monitoring Pembelajaran Taruna

|  |  |
| --- | --- |
| **Versi** | 1.0 (Draft) |
| **Tanggal** | 1 Oktober 2026 |
| **Platform** | Web (desktop-first, responsif) |
| **Pengguna** | Admin (single role) |

---

## 1. Ringkasan

Aplikasi web internal bagi **admin** untuk memantau dan merekap pelaksanaan pembelajaran Taruna. Admin mencatat dan melihat kehadiran per dosen, per mata kuliah, per pertemuan (minggu 1-16), lengkap dengan metode pembelajaran (Teori/Praktik), persentase kehadiran, dan total kehadiran, serta dapat memfilter rekap per bulan.

## 2. Latar Belakang & Masalah

- Rekap monitoring pembelajaran umumnya dikerjakan manual (spreadsheet/kertas), rawan salah hitung dan sulit dicari per bulan.
- Tidak ada satu tampilan ringkas untuk melihat dosen mana yang sudah/belum menyelesaikan pertemuan.
- Penyusunan laporan bulanan memakan waktu.

## 3. Tujuan & Metrik Keberhasilan

| Tujuan | Metrik |
| --- | --- |
| Rekap terpusat dan akurat | 100% data rekap tersimpan di sistem, tanpa hitung manual |
| Menghemat waktu laporan | Rekap bulanan dihasilkan \< 1 menit (vs. manual) |
| Mudah dipakai admin | Input 1 pertemuan \< 30 detik |
| Data konsisten | Persentase & total kehadiran dihitung otomatis, 0 selisih |

## 4. Pengguna

**Admin** — satu-satunya peran. Mengelola master data, menginput/mengubah monitoring, melihat rekap, dan mengekspor laporan. Tidak ada akses publik; dosen/taruna tidak login (v1).

## 5. Ruang Lingkup

**Termasuk (In Scope):**

- Login admin
- Master data: Dosen, Mata Kuliah, Periode/Semester
- Input monitoring per pertemuan (1-16)
- Tabel rekap dengan filter (termasuk bulan)
- Perhitungan otomatis persentase & total kehadiran
- Ekspor Excel/PDF

**Tidak Termasuk (v1):**

- Login dosen/taruna
- Absensi real-time (QR/fingerprint)
- Notifikasi otomatis (WhatsApp/email)
- Integrasi SIAKAD

## 6. Kebutuhan Fungsional

### 6.1 Autentikasi

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-01 | Admin login dengan username & password | Must |
| FR-02 | Logout & sesi berakhir otomatis setelah tidak aktif (mis. 30 menit) | Should |
| FR-03 | Ubah/reset password admin | Should |

### 6.2 Master Data

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-04 | CRUD **Dosen** (nama, NIDN/NIP opsional, status aktif) | Must |
| FR-05 | CRUD **Mata Kuliah** (kode, nama, SKS, metode default) | Must |
| FR-06 | CRUD **Periode** (semester/tahun ajaran, tanggal mulai-selesai) | Must |
| FR-07 | Penugasan: relasi Dosen - Mata Kuliah - Metode (T/P) - Periode | Must |
| FR-08 | Nonaktifkan data (soft delete) agar riwayat rekap tidak hilang | Should |

### 6.3 Input Monitoring

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-09 | Admin memilih penugasan (dosen + mata kuliah + metode) lalu mengisi status tiap pertemuan 1-16 | Must |
| FR-10 | Status per pertemuan: **Hadir / Tidak Hadir / Belum Terlaksana** (opsional: Izin/Pengganti) | Must |
| FR-11 | Setiap pertemuan memiliki **tanggal pelaksanaan** (menentukan bulan untuk filter) | Must |
| FR-12 | Kolom catatan opsional per pertemuan | Could |
| FR-13 | Edit & koreksi data; setiap perubahan tercatat (audit log: siapa, kapan) | Should |
| FR-14 | Input cepat: klik sel pada tabel rekap untuk mengubah status | Should |

### 6.4 Tabel Rekap (Fitur Utama)

Kolom tabel:

| # | Kolom | Keterangan |
| --- | --- | --- |
| 1 | Nama Dosen | Dari master dosen |
| 2 | Mata Kuliah | Dari master mata kuliah |
| 3 | Metode Pembelajaran | **T** (Teori) / **P** (Praktik) |
| 4 | Pertemuan 1-16 | 16 kolom status (ikon/warna: hijau = hadir, merah = tidak hadir, abu = belum) |
| 5 | Persentase Kehadiran | Dihitung otomatis |
| 6 | Total Kehadiran | Jumlah pertemuan berstatus Hadir |

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-15 | Tampilkan rekap dalam tabel dengan kolom di atas | Must |
| FR-16 | **Filter bulan**: dropdown pilihan bulan (Januari-Desember) + opsi "Semua Bulan"; hanya pertemuan yang tanggalnya jatuh di bulan terpilih yang ditampilkan dan dihitung | Must |
| FR-17 | Filter tambahan: periode/semester, dosen, mata kuliah, metode (T/P) | Must |
| FR-18 | Pencarian berdasarkan nama dosen / mata kuliah | Should |
| FR-19 | Pengurutan kolom (nama, persentase, total) | Should |
| FR-20 | Pagination / scroll horizontal untuk 16 kolom pertemuan, header tabel sticky | Should |
| FR-21 | Baris ringkasan: rata-rata persentase kehadiran seluruh data terfilter | Could |
| FR-22 | Penanda visual untuk persentase di bawah ambang batas (mis. \< 75%) | Could |

### 6.5 Perhitungan

- **Total Kehadiran** = jumlah pertemuan dengan status *Hadir* (dalam filter yang aktif).
- **Persentase Kehadiran** = (Total Kehadiran ÷ jumlah pertemuan yang dihitung) × 100%.
  - Filter **Semua Bulan**: pembagi = 16 (atau jumlah pertemuan terjadwal/terlaksana — lihat Pertanyaan Terbuka #2).
  - Filter **per bulan**: pembagi = jumlah pertemuan yang tanggalnya berada di bulan tersebut.
- Pertemuan berstatus *Belum Terlaksana* tidak masuk pembagi (opsi default; dapat dikonfigurasi).
- Pembulatan 1 angka desimal (mis. 87,5%).

**Contoh:** Dosen A, MK X (T), Januari memiliki 4 pertemuan; hadir 3 → Total = 3, Persentase = 75,0%.

### 6.6 Ekspor

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-23 | Ekspor tabel rekap (sesuai filter aktif) ke Excel (.xlsx) | Must |
| FR-24 | Ekspor ke PDF siap cetak (landscape) | Should |

## 7. Model Data (Garis Besar)

| Entitas | Field Utama |
| --- | --- |
| **admin** | id, username, password_hash, nama |
| **dosen** | id, nama, nidn, aktif |
| **mata_kuliah** | id, kode, nama, sks, aktif |
| **periode** | id, nama (mis. 2026/2027 Ganjil), tgl_mulai, tgl_selesai, aktif |
| **penugasan** | id, dosen_id, mata_kuliah_id, periode_id, metode (T/P) |
| **pertemuan** | id, penugasan_id, minggu_ke (1-16), tanggal, status, catatan |
| **audit_log** | id, admin_id, aksi, entitas, waktu, nilai_lama, nilai_baru |

Aturan: kombinasi (penugasan_id, minggu_ke) unik. Satu dosen dapat mengampu beberapa mata kuliah; mata kuliah yang sama dapat memiliki metode T dan P sebagai dua penugasan terpisah.

## 8. Alur Pengguna Utama

1. Admin login → masuk **Dashboard Rekap**.
2. Pilih periode, lalu (opsional) bulan, dosen, mata kuliah, metode.
3. Tabel menampilkan rekap; admin mengklik sel pertemuan untuk mengubah status/tanggal.
4. Persentase & total kehadiran ter-update otomatis.
5. Admin klik **Ekspor** untuk mengunduh laporan.

## 9. Gambaran Antarmuka

**Halaman:** Login · Dashboard Rekap · Kelola Dosen · Kelola Mata Kuliah · Kelola Penugasan · Kelola Periode · Pengaturan Akun.

**Dashboard Rekap (sketsa):**

```
[Periode ▾] [Bulan ▾] [Dosen ▾] [MK ▾] [T/P ▾] [Cari...]   [Ekspor ▾]
---------------------------------------------------------------------------
Dosen | Mata Kuliah | T/P | 1 2 3 4 ... 16 | % Hadir | Total
---------------------------------------------------------------------------
...   | ...         | T   | ✓ ✓ ✗ ✓ ... -  | 87,5%   | 14
```

## 10. Kebutuhan Non-Fungsional

- **Keamanan:** password di-hash (bcrypt/argon2), HTTPS, proteksi CSRF/XSS/SQL injection, semua halaman butuh autentikasi.
- **Performa:** tabel rekap termuat \< 3 detik untuk hingga 500 penugasan.
- **Ketersediaan:** akses pada jam kerja akademik; backup database harian.
- **Kompatibilitas:** Chrome, Edge, Firefox versi terbaru; tampilan tablet didukung.
- **Kegunaan:** bahasa antarmuka Indonesia; format tanggal dd-mm-yyyy.
- **Auditabilitas:** log perubahan data disimpan minimal 1 tahun.

## 11. Kriteria Penerimaan (Contoh)

- Admin dapat membuat penugasan dan mengisi 16 pertemuan, lalu total & persentase tampil benar.
- Memilih bulan "Maret" hanya menampilkan/menghitung pertemuan bertanggal Maret.
- Mengubah status satu pertemuan memperbarui persentase tanpa reload manual.
- Hasil ekspor Excel sama persis dengan tabel yang terfilter di layar.
- Pengguna tanpa login tidak dapat mengakses halaman mana pun.

## 12. Rencana Rilis

| Fase | Isi | Estimasi |
| --- | --- | --- |
| **MVP** | Login, master data, input pertemuan, tabel rekap, filter bulan, hitung otomatis | 4-6 minggu |
| **v1.1** | Ekspor Excel/PDF, audit log, pencarian & sorting | 2 minggu |
| **v2 (opsional)** | Dashboard grafik, peran tambahan, impor dari Excel, notifikasi | TBD |

## 13. Risiko & Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Aturan perhitungan persentase berbeda dari kebijakan institusi | Konfirmasi rumus sebelum pengembangan (lihat Pertanyaan Terbuka) |
| Salah input oleh admin | Audit log, konfirmasi ubah data, fitur koreksi |
| Data awal masih di spreadsheet | Sediakan fitur impor Excel (v2) atau migrasi manual satu kali |
| Tabel 16 kolom sulit dibaca di layar kecil | Header sticky, scroll horizontal, desktop-first |

## 14. Asumsi

- Hanya satu peran (admin); jumlah admin sedikit.
- "T/P" = **Teori/Praktik**.
- "Kehadiran" = kehadiran **dosen** dalam melaksanakan pertemuan pada monitoring pembelajaran.
- Satu periode = satu semester dengan maksimal 16 pertemuan.

## 15. Pertanyaan Terbuka

1. Kehadiran yang direkap adalah kehadiran **dosen**, kehadiran **taruna**, atau keduanya? (Jika taruna, perlu entitas Taruna/Kelas dan absensi per taruna.)
2. Pembagi persentase: selalu 16, atau hanya pertemuan yang sudah terjadwal/terlaksana?
3. Apakah perlu status tambahan (Izin, Sakit, Kuliah Pengganti)?
4. Berapa ambang batas persentase minimum yang harus ditandai?
5. Apakah perlu pembedaan kelas/angkatan/prodi pada rekap?
6. Format laporan resmi yang harus diikuti saat ekspor (kop, tanda tangan)?