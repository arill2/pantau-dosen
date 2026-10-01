# DESIGN.md – Pantau Dosen

> Arah desain untuk aplikasi **Rekap Monitoring Pembelajaran Taruna**.
> Dokumen ini adalah sumber "soul"; `antislop.md` dipakai sebagai filter di atasnya.

## Design Read

Reading this as: **internal academic monitoring workspace** for **institution admins (Bahasa Indonesia, desktop-first with real mobile use)**, in a **warm institutional "ledger"** visual language, dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

Alasan dial:
- **ENERGY 2** – ini alat kerja harian, bukan halaman pemasaran. Ramah tapi tidak berisik; hierarki jelas, bukan dekorasi.
- **RHYTHM 2** – halaman punya ritme konsisten (filter bar, summary strip, tabel) dengan satu pembeda besar: tabel pekan yang jadi fokus. Tidak monoton, tidak acak.
- **MOTION 1** – hover, fokus, dan transisi halus saja. Tidak ada animasi berjalan terus; data yang penting harus diam dan terbaca.

## Konteks Produk

- Pengguna: **admin** tunggal (staf akademik). Bukan publik, bukan dosen/taruna.
- Tugas inti: mencatat kehadiran dosen per pertemuan (pekan 1–16) per mata kuliah, lalu merekap dan mengekspor.
- Media pakai utama: layar kerja desktop/tablet; HP dipakai untuk cek cepat dan koreksi satu sel.

## Palet

Referensi palet: kartu hangat **#DF6C4F** (Awwwards, Viture Dashboard) dilunakkan menjadi aksen coral; dasar kertas hangat agar mata tahan saat membaca tabel panjang.

| Token | Light | Dark | Peran |
| --- | --- | --- | --- |
| `paper` | `#F7F4EF` | `#16130F` | Latar aplikasi (kertas hangat) |
| `surface` | `#FFFFFF` | `#201C17` | Kartu, panel, tabel |
| `surface-2` | `#F1ECE4` | `#2A251E` | Baris bergantian, header tabel |
| `ink` | `#1E1B16` | `#F3EEE5` | Teks utama |
| `muted` | `#6B6257` | `#B3A99B` | Teks sekunder (kontras ≥ 4.5:1 di atas `paper`) |
| `line` | `#E4DDD2` | `#3A332A` | Garis, border |
| `brand` | `#B23A1E` | `#E0724E` | Aksi utama (rust), kontras putih 5.97:1 (light) |
| `accent` | `#DF6C4F` | `#DF6C4F` | Aksen coral, hanya untuk momen kunci |
| `hadir` | `#2F7D4F` | `#6FBF8B` | Status hadir |
| `alfa` | `#B3261E` | `#E5877E` | Status tidak hadir |
| `belum` | `#6B6257` | `#B3A99B` | Status belum terlaksana |
| `izin` | `#B45309` | `#E0A458` | Izin / pengganti |

Palet aktif = 2 inti (rust + coral) + netral. Status bukan "warna merek", melainkan sinyal data; selalu didampingi label/ikon, bukan warna saja.

## Tipografi

**Plus Jakarta Sans** (400/500/600/700/800).

Alasan: huruf ini dirancang untuk konteks Indonesia, jadi cocok dengan bahasa antarmuka (Bahasa Indonesia) dan lembaga dalam negeri. Humanis-geometris: tegas seperti dokumen institusi, tapi tetap ramah untuk pemakaian lama. Angka memakai varian `tabular-nums` agar kolom persentase dan pekan rata dan mudah dibandingkan.

## Identitas (motif)

**Jalur Pekan** – enam belas pekan semester digambar sebagai satu strip tersegmentasi, seperti pita absensi. Motif ini muncul di ringkasan atas, di tiap baris, dan sebagai garis tipis di bawah judul bagian. Ia berasal dari produk (16 pertemuan), bukan tempelan dekoratif. Inilah yang membuat desain tetap khas meski nama produk diganti.

## Prinsip Komposisi

- Satu titik fokus per layar: tabel pekan.
- Ruang kosong sebagai pemisah kelompok, bukan sisa.
- Sudut kecil dan konsisten: 6px (sel/kontrol), 10px (kartu), 999px hanya untuk pil status yang memang perlu.
- Bayangan hanya untuk lapisan yang benar-benar mengambang (dialog, menu) sebagai penanda elevasi.
- Tidak ada glow, tidak ada gradient dekoratif, tidak ada glassmorphism.

## Gerak

Hanya hover, fokus, dan transisi masuk panel. Durasi 120–200ms, `ease-out`. Hormati `prefers-reduced-motion`.

## Keputusan & Alasan (R-31)

- Warna rust dipilih agar melekat pada lembaga pendidikan/maritim Indonesia, bukan biru SaaS default.
- Tabel pekan jadi fokus karena itu inti pekerjaan admin.
- Tema terang default (kerja siang, banyak teks); toggle gelap disediakan untuk kerja malam dan tetap diuji penuh.
- Mobile memakai tampilan kartu agar 16 kolom tidak memaksa scroll menyakitkan di layar sempit.
