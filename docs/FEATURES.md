# Scope: demo UMKM & Pekerja (Modul 3 SIDP + contoh klien)

Ada **dua** sumber permintaan, dan keduanya mengikat:

1. **Modul 3** — menentukan apa yang harus bisa dilakukan peserta di kelas (bukti terukur + rubrik).
2. **Contoh aplikasi dari klien** (`sjkfinanceprodemo.sjktech.web.id`) — menentukan **permukaan
   produk**: modul apa saja yang harus ada, karena itulah yang dimaksud klien dengan "seperti ini".

Kesalahan saya sebelumnya: memakai hanya sumber #1, sehingga aplikasi menyusut jadi buku kas.
Permukaan produk mengikuti #2; jalur kelas mengikuti #1. Keduanya hidup di satu aplikasi.

---

## 1. Yang modul wajibkan (kutipan)

| Kutipan | Konsekuensi |
|---|---|
| "Menginput Minimal 5 Transaksi Riil/Simulasi" | input cepat + penghitung 5 transaksi |
| "Memisahkan Kas Usaha & Dapur" | minimal dua dompet, terlihat di laporan |
| "Buat profil usaha (Nama Usaha dan Nomor HP)" | profil singkat |
| "tulis keterangan barangnya" | field keterangan |
| "otomatis menghitung berapa keuntungan bersih hari ini" | laba hari ini |
| "menu Laporan untuk melihat selisih uang masuk dan uang keluar" | layar laporan |
| Rubrik skor 3 & 4 | pencapaian terlihat, laporan bisa dibaca sendiri |

## 2. Yang contoh klien tetapkan (inventaris hasil reverse engineering)

Aplikasi contoh: React + Google Apps Script + Google Sheets, tanpa login, reset demo 30 menit.
35 komponen, modul berikut:

| Modul di contoh klien | Ada di contoh | Untuk UMKM | Untuk Pekerja |
|---|---|---|---|
| Dashboard (ringkasan + grafik) | ✅ | ✅ | ✅ |
| Transaksi masuk/keluar | ✅ | ✅ inti | ✅ inti |
| Akun / dompet | ✅ | ✅ Kas Usaha, Dapur | ✅ Uang Kerja, Pribadi |
| Kategori (termasuk kustom) | ✅ | ✅ | ✅ |
| Anggaran / budget | ✅ | ✅ belanja stok | ✅ harian/mingguan |
| Utang piutang | ✅ | ✅ bon pelanggan + utang supplier | ✅ cicilan/paylater |
| Tujuan / goals | ✅ | ✅ beli alat, tambah stok | ✅ dana darurat |
| Investasi / aset | ✅ | ⚠️ fase 3 (aset usaha) | ❌ |
| Siklus gajian (payday cutoff) | ✅ | ✅ gajian karyawan / panen | ✅ setoran harian |
| Kesehatan keuangan | ✅ | ✅ | ✅ |
| Gamifikasi (badge) | ✅ | ✅ (cocok utk kelas) | ✅ |
| Laporan | ✅ | ✅ laba/rugi, arus kas | ✅ sisa harian/mingguan |
| Aturan 50/30/20 | ✅ | ❌ | ✅ |
| Split bill | ✅ | ❌ | ⚠️ fase 3 |
| Kalkulator | ✅ | ✅ HPP, cicilan aman | ✅ |
| Scan struk (AI) | ✅ | ⚠️ fase 3 | ⚠️ fase 3 |
| AI chat | ✅ | ⚠️ fase 3 | ⚠️ fase 3 |

Bukti: `sjkfinanceprodemo` menyimpan data di `sjk_modular_db_cache` dengan kunci
`transactions, accounts, debts, goals, investments, budgets, customcategories`, plus
`sjk_payday_cutoff` dan `sjk_gemini_api_key`; fungsi server: `apiGetAllData`, `apiSaveRecord`,
`apiDeleteRecord`, `apiResetWithDummyData`.

---

## 3. Fase pengerjaan

**Fase 1 — demo kelas (Desember 2026), wajib jalan**
Dashboard ringkas · Transaksi (nominal, keterangan, dompet, jenis) · Dompet 2 buah · Kategori dasar ·
Laporan hari ini (masuk, keluar, selisih) · Profil · penghitung 5 transaksi · pengaturan tampilan ·
tanpa login · PWA-friendly.

**Fase 2 — produk (setelah demo diterima) — SUDAH DIBANGUN**
Anggaran · Utang/piutang dua arah · Tujuan · Badge · Grafik mingguan · Kesehatan keuangan ·
Siklus gajian · Kategori kustom · Ekspor CSV/PDF.

Status per modul (diverifikasi di browser, bukan dari kode saja):

| Modul | Bukti | Catatan |
|---|---|---|
| Anggaran | batas per kategori, meter dengan angka + sisa | bulan berjalan, per kategori keluar |
| Utang & piutang | daftar dua arah, total, "Tandai lunas" | baris lunas ditandai kata + coretan |
| Tujuan | target, tabungan cepat (chip), persen | tidak bisa melebihi target |
| Kategori kustom | tambah/hapus, kategori terpakai tidak bisa dihapus | menjaga riwayat transaksi |
| Grafik mingguan | tabel 7 hari Senin–Minggu dengan angka per batang | tabel asli, bukan kanvas |
| Kesehatan keuangan | skor 0–100 dari 3 aturan, tiap poin punya kalimat | rumus ditampilkan |
| Siklus gajian | mingguan/bulanan, sisa hari, batas belanja harian | dihitung dari entri nyata |
| Badge | 7 pencapaian dengan syarat berangka | status "Sudah"/"Belum" |
| Ekspor | CSV terunduh nyata (BOM untuk Excel) + cetak PDF | nama berkas memakai tanggal |
| HPP (UMKM) | bahan+tenaga+kemasan ÷ porsi, margin 20–50% | pembulatan ke atas per 500 |
| Aturan 50/30/20 (pekerja) | kebutuhan/keinginan/tabungan vs pengeluaran nyata | patokan, bukan aturan mati |
| Cicilan aman (pekerja) | batas 30% + putusan | sama seperti dipakai paylater |

Data Fase 2 disimpan di perangkat (localStorage, namespace per aplikasi) karena demo belum punya
akun; pertanyaan §7 nomor 1 masih terbuka. Setiap koleksi dipetakan 1:1 ke tabel saat lapisan akun
dibangun.

**Fase 3 — sebagian sudah dibangun, sisanya menunggu permintaan**

| Fitur | Status | Bukti |
|---|---|---|
| Scan struk | ✅ jalur **tanpa AI** (tempel teks struk) | total dari baris "TOTAL", tanggal `22/11/2026` dan `22 November 2026`, merchant; angka lain ditawarkan sebagai chip |
| Tanya catatan | ✅ jawaban **tanpa model** dari data lokal | 8 niat (laba, keluar terbesar, dompet, anggaran, utang, tujuan, jumlah transaksi, fallback) — 12 unit test |
| Split bill (pekerja) | ✅ | pembagian bulat rupiah + sisa disebut; 100.000 ÷ 3 = 33.333 + 1 |
| Aset usaha (UMKM) | ✅ | harga beli, nilai sekarang, susut, daftar |
| Offline queue | ✅ | antrean lokal, retry saat online, jumlah terlihat di menu Sinkronisasi — 4 unit test |
| Scan struk dari **foto** | ✅ | `qwen3.8-flash` (vision) membaca foto struk: total, tanggal, merchant. Uji nyata: struk sintetis 137.000 terbaca benar, bukan angka tunai 150.000 |
| AI chat model bahasa | ✅ | `deepseek-v4.1-flash` menjawab dari ringkasan data di perangkat; tombol "Hitung sendiri" tetap ada sebagai jalur tanpa AI |
| Multi-pengguna per usaha | ⛔ belum | butuh akun + hak akses; demo sengaja tanpa login |
| Aset/investasi sebagai portofolio | ⚠️ sebagian | aset tetap sudah; investasi belum |

Aturan §5 tetap berlaku: fitur AI wajib punya jalur tanpa AI — karena itu scan struk dan tanya
jawab dibangun sebagai fungsi deterministik lebih dulu, dan tidak ada UI yang berpura-pura
memanggil model saat tidak ada.

---

## 4. Dua aplikasi, satu basis kode

| | UMKM | Pekerja |
|---|---|---|
| Dompet | Kas Usaha · Dompet Dapur | Uang Kerja · Uang Pribadi |
| Kata | Uang masuk / keluar; untung | Pendapatan / pengeluaran; sisa |
| Modul khusus | utang-piutang usaha, HPP, aset | cicilan/paylater, 50/30/20 |
| Sisanya | sama | sama |

Deploy: dua project Vercel, dua subdomain, satu workspace. Pisah repo hanya setelah paket
`@sidp/ui` dipublikasikan (Vercel tidak bisa resolve dependency di luar root repo).

---

## 5. Batasan aksesibilitas yang berlaku untuk SEMUA modul

Contoh klien **tidak** aksesibel (tanpa label, `user-scalable=no`, warna sebagai satu-satunya penanda,
JSX dikompilasi di browser). Setiap modul di atas harus lolos:

- target sentuh ≥48 px (utama 56–64 px), jarak ≥14 px
- teks 18 px dasar, bisa diperbesar 3 tingkat
- kontras 7:1 target / 4,5:1 minimum, dicek otomatis
- tanpa drag (2.5.7), tanpa ikon tanpa teks, tanpa placeholder sebagai label
- grafik/badge: makna tidak boleh warna saja — selalu ada angka atau kata
- AI chat & scan struk (fase 3) wajib punya jalur alternatif tanpa AI

---

## 6. Yang TIDAK diambil dari contoh klien

| Di contoh klien | Kenapa tidak |
|---|---|
| Tanpa otorisasi apa pun | data 50 peserta akan saling terlihat |
| API key Gemini di `localStorage` | kunci bocor di perangkat bersama |
| `apiSaveRecord(sheetName, …)` dari klien | klien menentukan sheet tujuan |
| Babel standalone di browser | 438 KB JSX dikompilasi di HP murah |
| Reset paksa 30 menit | menggantikan akun, bukan menyelesaikannya |
| Viewport `user-scalable=no` | memblokir zoom (WCAG 1.4.4) |

---

## 7. Yang masih perlu diputuskan klien

1. Publik atau privat datanya? (contoh klien = satu spreadsheet bersama; demo kelas = per perangkat)
2. Perlu layar fasilitator untuk menilai 50 peserta, atau penilaian tetap di kertas?
3. Fase 2 diminta sekarang atau setelah pelatihan?

## Proxy AI (fase 3)

Klien memanggil `fintracker-api`, bukan penyedia model. Kunci model hanya ada di environment
project API (`AI_BASE_URL`, `AI_MODEL`, `AI_VISION_MODEL`).

| Pengaman | Isi |
|---|---|
| `x-ai-token` | token demo; ikut ter-inline di bundel frontend, jadi ini **bukan rahasia**, hanya penghalang lambat |
| Rate limit | 40 permintaan/jam per IP (in-memory per instance) |
| Tanpa token | `401` (diuji) |
| Tanpa konfigurasi | `503`, dan UI menyembunyikan tombol AI |

Deployment Protection project API **dimatikan** supaya peramban bisa memanggilnya; konsekuensinya
endpoint ini publik. Kalau demo selesai, matikan lagi proteksinya atau hapus project-nya.
