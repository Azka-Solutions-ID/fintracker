# SIDP Keuangan — base demo (UMKM + Pekerja)

Base dua aplikasi untuk Modul 3 SIDP (pencatatan keuangan digital), dibangun untuk pengguna
45+, literasi digital rendah, dan penyandang disabilitas.

```
apps/umkm       Catatan Usaha   → subdomain umkm.*
apps/pekerja    Catatan Penghasilan → subdomain pekerja.*
packages/tokens Token desain + pemeriksa kontras
packages/ui     Komponen aksesibel (MoneyInput, WalletPicker, Settings, HelpBar)
packages/api    Elysia + Supabase
supabase/       Migrasi SQL (RLS per perangkat)
docs/           ACCESSIBILITY.md (aturan) · STACK.md (keputusan teknis) · FEATURES.md (split UMKM vs Pekerja)
```

## Jalankan

```bash
bun install
bun run dev:umkm      # http://localhost:5173
bun run dev:pekerja   # http://localhost:5174
bun run dev:api       # http://localhost:3000
bun run check:tokens  # kontras palet
bun test packages     # unit test
bun run build         # build kedua app
```

Environment:

```
# apps/*/.env.local
VITE_API_URL=http://localhost:3000

# packages/api/.env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
ALLOWED_ORIGINS=https://umkm.contoh.id,https://pekerja.contoh.id
```

## Deploy

Dua project Vercel, root directory `apps/umkm` dan `apps/pekerja`, masing-masing dengan
`vercel.json` yang sudah memakai `bunVersion: 1.x`. API bisa jadi project ketiga dengan
root `packages/api`. Supabase: jalankan migrasi di `supabase/migrations`, lalu aktifkan
anonymous sign-in di dashboard.

## Batasan base ini (sengaja)

- Belum ada service worker/offline queue — data lokal di `localStorage`, sinkron fire-and-forget.
- Belum ada mode fasilitator (roster 50 peserta, skor rubrik) — menyusul saat lingkup pelatihan jelas.
- Belum ada ekspor PDF "siap KUR".
- Belum diuji dengan pengguna nyata; lihat checklist di `docs/ACCESSIBILITY.md`.

## Status modul

Fase 1 (demo kelas) dan Fase 2 (produk) sudah jalan di kedua aplikasi:
Catat · Laporan · Anggaran · Utang & piutang · Tujuan · Kategori · Grafik mingguan ·
Kesehatan keuangan · Siklus gajian · Pencapaian · Ekspor · (UMKM) Kalkulator HPP ·
(pekerja) Aturan 50/30/20 dan Cicilan aman.

Fase 3 yang bisa jalan tanpa model sudah dibangun: **Scan struk** (tempel teks, dibaca di
perangkat), **Tanya catatan** (jawaban deterministik dari angka sendiri), **Split bill**
(pekerja), **Aset usaha** (UMKM), dan **antrean offline** yang terlihat di menu Sinkronisasi.

Yang sengaja belum: scan dari foto, AI chat dengan model bahasa, dan multi-pengguna — semuanya
butuh model atau akun. Daftar itu tampil apa adanya di layar Fitur, tanpa tombol mati.

Data disimpan di perangkat (`localStorage`, namespace `sidp.umkm` / `sidp.pekerja`).
