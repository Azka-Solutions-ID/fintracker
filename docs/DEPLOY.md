# Deploy (Vercel)

## Topologi yang benar

Repo ini **monorepo** dengan dua aplikasi yang berdiri sendiri. Vercel membuat **satu project per
root directory** yang diimpor (lihat https://vercel.com/docs/monorepos — "you'll create a new
project for each directory in your monorepo that you wish to import"). Jadi jumlah project yang
benar sekarang: **dua**.

| Project | Root Directory | Framework | Build | Output | URL |
|---|---|---|---|---|---|
| `fintracker-umkm` | `apps/umkm` | Vite | `bun run build` | `dist` | https://fintracker-umkm.vercel.app |
| `fintracker-pekerja` | `apps/pekerja` | Vite | `bun run build` | `dist` | https://fintracker-pekerja.vercel.app |
| `fintracker-api` (opsional) | `packages/api` | Elysia | — | — | https://fintracker-api.vercel.app (SSO) |

Ketiga project ada di tim `mai-aphrodites-projects`. Dua yang pertama adalah aplikasi; yang ketiga
adalah API dan **tidak dipakai demo** (klien berjalan mode perangkat).

`Root Directory` adalah **setelan project**, bukan properti `vercel.json`
(sumber: https://github.com/vercel/vercel/blob/main/skills/vercel-cli/references/monorepos.md).
Karena itu `vercel.json` di tiap app hanya mengatur framework, perintah build, dan output.

Install dijalankan Vercel di **root repo** (bukan di dalam `apps/*`), memakai `bun.lock` di root
dan workspace `@sidp/ui` + `@sidp/tokens`. `installCommand` di tiap app dibatasi ke paketnya
sendiri supaya install lebih cepat (filtered installs, dokumentasi Vercel yang sama).

## Domain

Nama project dan domain produksi dibuat sama supaya tidak ada lagi kebingungan "URL mana milik
app mana": `fintracker-umkm.vercel.app`, `fintracker-pekerja.vercel.app`. Alias lama
(`umkm-five-dusky.vercel.app`, `pekerja-six.vercel.app`) masih hidup dan tetap menunjuk ke
deployment yang sama, jadi tautan lama tidak mati.

Domain baru ditambahkan dengan `vercel domains add <project>.vercel.app <project>` — bukan hanya
`vercel alias set`, karena alias saja tidak ikut produksi berikutnya.

## API: publik, dengan token demo

Deployment Protection project API dimatikan (PATCH `ssoProtection: null`) karena peramban harus
bisa memanggil `/v1/ai/*`. Penggantinya: header `x-ai-token` + rate limit 40/jam/IP, dan kunci
model tetap hanya di server.

Mematikan proteksi lagi setelah demo: buka project → Settings → Deployment Protection, atau
`vercel api /v9/projects/fintracker-api -X PATCH` dengan `ssoProtection` diisi konfigurasi SSO.

## API: catatan lama (SSO)

`fintracker-api.vercel.app/health` menjawab **302 ke vercel.com/sso-api**, bukan 200: project API
punya Deployment Protection. Artinya API **tidak bisa ditulis publik** — bagus untuk sekarang,
tapi juga berarti frontend belum bisa memakainya sampai proteksi itu dibuka (atau memakai
protection-bypass token) dan sebuah shared secret ditambahkan.

## Kalau sekarang ada tiga project

Periksa nama ketiganya di dashboard. Yang paling mungkin:

| Project ketiga | Tindakan |
|---|---|
| `packages/api` (Elysia/Bun server) | **Pause atau hapus** untuk demo ini. Demo berjalan tanpa server (data di perangkat); API baru dipakai saat akun ada. Kalau mau tetap hidup, isi env `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`, lalu set `VITE_API_URL` di dua project frontend. |
| repo **root** (`fintracker`) | **Hapus.** Root tidak punya aplikasi; build-nya tidak menghasilkan apa pun. |

Cara menghapus: Project → Settings → scroll ke bawah → Delete Project.

## Setelan per project (dashboard)

1. Project → **Settings** → **Build and Deployment**
2. **Root Directory** → Edit → pilih `apps/umkm` (atau `apps/pekerja`) → Continue
3. **Framework Preset**: Vite (terdeteksi otomatis)
4. **Build Command**: `bun run build` (dari `vercel.json`)
5. **Output Directory**: `dist`
6. **Install Command**: biarkan otomatis (`bun install`)
7. **Node.js Version**: 22.x — Bun dipakai untuk install/build lewat `bunVersion: "1.x"`
8. Deploy ulang: Deployments → ⋯ → Redeploy

Project ketiga yang salah root directory akan tetap membangun seluruh repo dan gagal atau
menghasilkan halaman kosong — itu gejala yang terlihat sebagai "tiga app".

## Subdomain

Dua project, dua domain:

- `umkm.<domain>` → `fintracker-umkm`
- `pekerja.<domain>` → `fintracker-pekerja`

Settings → Domains → Add. Jangan satu domain untuk dua project.

## Catatan Bun di Vercel

`bunVersion: "1.x"` sudah ada di setiap `vercel.json`. Tanpa itu Vercel memakai Node dan
`bun install` gagal. Kalau build error menyebut `bun: not found`, itu penyebabnya.

## Yang belum ada di deploy

- **Belum ada login.** Data tinggal di perangkat (localStorage), sesuai keputusan demo.
- **Belum ada `VITE_API_URL`.** Tanpa variabel itu, aplikasi berjalan mode perangkat saja dan
  menu Sinkronisasi menampilkan "Perangkat ini saja" — bukan error.
