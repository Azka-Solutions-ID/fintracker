# Keputusan aksesibilitas (jangan diubah tanpa alasan)

Sasaran: pemilik UMKM 45+, pekerja informal, dan penyandang disabilitas. Standar minimum
**WCAG 2.2 AA**; kontras teks dinaikkan ke target 7:1.

## Token (satu sumber: `packages/tokens/tokens.css`)

| Hal | Nilai | Konsekuensi kalau diturunkan |
|---|---|---|
| Teks isi | 18 px (21 / 24 px lewat pengaturan) | batas baca audiens 45+ |
| Tinggi aksi utama | 60 px | minimum fisik 1 cm; jari 1,6–2 cm |
| Target minimum | 48 px | di atas ambang Material 48dp dan WCAG 24 px |
| Jarak antar target | 14 px | target rapat memicu salah tekan |
| Line-height | 1,6 | |
| Kontras teks | 7:1 target, 4,5:1 lantai | dicek otomatis oleh `check-contrast.ts` |
| Kontras border/fokus | 3:1 | WCAG 1.4.11 |
| Durasi animasi | 120 ms, 0 ms bila reduksi | WCAG 2.3.3 |

## Aturan interaksi yang sudah dikunci di kode

- **Tanpa drag.** Dompet dipilih lewat radio besar (`WalletPicker`), bukan geser kartu. WCAG 2.5.7.
- **Tanpa placeholder sebagai label.** `Field` selalu merender `<label for>`.
- **Uang selalu dieja.** `MoneyInput` menampilkan "seratus dua puluh lima ribu rupiah" sebelum disimpan.
- **Tanpa warna saja.** Transaksi memakai kata "Masuk"/"Keluar", tidak hanya hijau/merah.
- **Urungkan, bukan konfirmasi.** Hasil simpan menampilkan tombol "Urungkan transaksi terakhir".
- **Bantuan di posisi tetap** (`HelpBar`, WCAG 3.2.6), dengan jalur ke manusia (WhatsApp pendamping).
- **Tanpa login.** Tidak ada tes kognitif (3.3.8). Kalau nanti perlu, batasnya PIN 4 digit.
- **Viewport tidak dikunci.** `user-scalable=no` dilarang (1.4.4).
- **Sticky bar tidak menutupi fokus** — `main` memberi padding bawah setinggi HelpBar (2.4.11).

## Pengaturan pengguna

Satu panel `SettingsPanel` (bukan "mode lansia" terpisah): ukuran huruf 3 langkah, kontras tinggi,
kurangi animasi. Tersimpan di localStorage, diterapkan lewat `data-*` pada `<html>`.

## Yang belum diverifikasi (butuh pengguna nyata)

Belum ada uji dengan pengguna karena belum ada basis pengguna. Status: **belum lulus gerbang
verifikasi**, bukan "sudah selesai". Checklist yang harus dijalankan sebelum demo dipakai:

1. 5 orang: 2 UMKM 50+, 1 pekerja informal, 1 penyandang disabilitas, 1 fasilitator.
2. Tugas: buka tautan → catat 5 transaksi tanpa dibantu. Ukur waktu dan **jumlah salah digit**.
3. TalkBack/VoiceOver saja: satu transaksi selesai tanpa melihat layar.
4. Zoom 200% pada lebar 320 px: tombol Simpan masih terjangkau.
5. HP termurah (≤2 GB RAM, sinyal lemah): paint pertama benar-benar muncul.

Sampai 1–5 dijalankan, jangan menyebut demo ini "ramah lansia" di depan klien — sebut
"mengikuti pedoman WCAG 2.2 AA dan pola yang terbukti pada literatur", itu klaim yang jujur.

## Pernyataan aksesibilitas (tampil di aplikasi)

Menu **Aksesibilitas** (sidebar desktop, kartu di layar Fitur) memuat pernyataan yang bisa
ditunjukkan ke klien:

- sasaran **WCAG 2.2 AA**, diuji axe-core 4.10.2 pada 31 layar, **0 pelanggaran**
- daftar kepatuhan per kriteria (teks 18 px, target 48/60 px, kontras 7:1/4,5:1, tanpa drag,
  status tidak warna-saja, label terlihat, uang diucapkan)
- **batasan yang diakui**: belum diuji dengan pembaca layar sungguhan bersama pengguna
  disabilitas, antarmuka hanya Bahasa Indonesia, fitur AI butuh internet

Rujukan yang ditautkan dari dalam aplikasi:

| Rujukan | URL |
|---|---|
| W3C WCAG 2.2 | https://www.w3.org/TR/WCAG22/ |
| W3C WCAG 2.2 Quick Reference | https://www.w3.org/WAI/WCAG22/quickref/ |
| British Council — Accessibility statement | https://www.britishcouncil.org/accessibility |

Catatan untuk klien: pernyataan British Council menyebut situs mereka selaras **WCAG 2.1 AA**;
aplikasi ini menargetkan **2.2 AA**, yang mencakup seluruh kriteria 2.1 AA ditambah sembilan
kriteria baru (mis. 2.4.11 fokus tidak tertutup, 2.5.7 tanpa gestur geser, 3.3.8 autentikasi).
