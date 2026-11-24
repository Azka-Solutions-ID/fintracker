# Stack: cukup? Ya — dengan tiga catatan

Tumpukan yang dipakai: React 19 + ARIA, Bun, Elysia, Supabase (Postgres + RLS), Vercel.

## Yang sudah diverifikasi

| Klaim | Bukti |
|---|---|
| Bun berjalan di Vercel Functions | Vercel docs *Using the Bun Runtime with Vercel Functions* — "available in Beta on all plans"; Bun 1.4 masuk Vercel Functions (20 Agu 2026); `bunVersion: "1.x"` di `vercel.json` |
| Elysia didukung resmi di Vercel | Changelog Vercel 17 Nov 2025 "Elysia can now be automatically deployed on Vercel"; halaman docs `vercel.com/docs/frameworks/backend/elysia`; `Bun.serve` diterima sebagai entrypoint (10 Agu 2026) |

## Tiga catatan (bukan blocker)

1. **Runtime Bun di Vercel masih Beta.** Untuk demo ini tidak masalah. Rencana mundur kalau
   bermasalah: `@elysiajs/node` (adapter resmi) di runtime Node, kode aplikasi tidak berubah.
2. **Function Vercel stateless.** Jangan buka koneksi Postgres langsung dari function; lewat
   `@supabase/supabase-js` (HTTP) atau connection pooler. Base ini sudah begitu.
3. **Dua repo vs monorepo.** Dua aplikasi tetap jadi dua project Vercel dan dua subdomain
   (`umkm.…`, `pekerja.…`), tapi **satu monorepo Bun workspace** karena Vercel tidak bisa
   me-resolve dependency di luar root repo (`file:../paket-bersama` gagal saat build).
   Kalau klien benar-benar menuntut repo terpisah: publikasikan `@sidp/ui` + `@sidp/tokens`
   ke registry privat (GitHub Packages), lalu pindahkan tiap `apps/*` jadi repo sendiri.

## Model data & auth (tanpa login)

- `supabase.auth.signInAnonymously()` sekali per perangkat → token disimpan di perangkat itu.
- Klien mengirim token ke API; API membuat klien Supabase **dengan token itu**, jadi RLS
  (`auth.uid() = user_id`) yang menjaga data antar perangkat.
- Anon key saja **tidak boleh** bisa membaca baris perangkat lain. Uji ini sebelum demo.
- Anonim sign-in harus diaktifkan di dashboard Supabase (Authentication → Providers →
  Anonymous sign-ins). Ini langkah manual, tidak bisa lewat migrasi.

## Offline (langkah berikut, belum dibangun)

Base ini menyimpan transaksi di `localStorage` dan mengirim ke API secara fire-and-forget.
Untuk PWA penuh: tambah service worker + antrean sinkronisasi (IndexedDB) + retry saat online.
Belum dikerjakan karena demo belum butuh; jangan pura-pura sudah ada.

## Layout responsif

| Lebar | Navigasi | Konten |
|---|---|---|
| < 900 px | bar bawah 5 tujuan (Catat, Laporan, 2 modul harian, Fitur) | satu kolom |
| ≥ 900 px | sidebar tetap, semua tujuan satu tingkat | satu kolom lebar, tanpa bar bawah |
| ≥ 1200 px | sidebar + kolom kedua | formulir + ringkasan/Rincian di kanan |

Semua tujuan ada di satu tingkat di kedua ukuran: di ponsel modul yang dipakai harian masuk bar
bawah, sisanya jadi kartu di layar Fitur (dua kolom, ikon + nama). Tidak ada menu bertingkat
yang harus dibuka dulu. Target sentuh tetap 48 px di sidebar; nav sidebar menggulir sendiri
kalau layar pendek, dan tautan bantuan selalu terlihat di bawah.
