import { Intro, Row, Rows, type ModuleProps } from "./parts";

/** The accessibility statement the client asked to be able to point at. It lives in the app
    itself, not only in a PDF: standard, what was measured, what is still limited, and where the
    requirements come from. */

const REFS = [
  {
    href: "https://www.w3.org/TR/WCAG22/",
    title: "W3C — Web Content Accessibility Guidelines (WCAG) 2.2",
    note: "Dokumen standarnya, level A sampai AAA.",
  },
  {
    href: "https://www.w3.org/WAI/WCAG22/quickref/",
    title: "W3C — WCAG 2.2 Quick Reference",
    note: "Daftar semua kriteria sukses beserta tekniknya.",
  },
  {
    href: "https://www.britishcouncil.org/accessibility",
    title: "British Council — Accessibility statement",
    note: "Pernyataan aksesibilitas situs British Council (acuan kebijakan klien).",
  },
];

export function AksesibilitasModule(_props: ModuleProps) {
  return (
    <>
      <Intro>
        Aplikasi demo SIDP Modul 3. Dirancang untuk pemilik UMKM 45+, pekerja informal, dan penyandang disabilitas,
        dengan sasaran <strong>WCAG 2.2 level AA</strong>.
      </Intro>

      <Rows>
        <Row label="Standar sasaran" value="WCAG 2.2 AA" />
        <Row label="Diuji otomatis" value="axe-core 4.10.2" />
        <Row label="Layar diperiksa" value="31 layar, 0 pelanggaran" />
        <Row label="Reflow 320 px" value="tanpa geser samping" />
      </Rows>

      <h3 className="h-section">Yang sudah dipenuhi</h3>
      <div className="card">
        <ul className="plain-list">
          <li>Teks isi 18 px, bisa diperbesar tiga tingkat tanpa memotong isi (1.4.4).</li>
          <li>Target sentuh minimal 48 px, tombol utama 60 px, jarak antar target 14 px.</li>
          <li>Kontras teks 7:1 (lantai 4,5:1) dan batas/fokus 3:1, dicek otomatis setiap build.</li>
          <li>Tidak ada gestur geser untuk memilih atau menghapus (2.5.7); pilihan selalu berupa tombol.</li>
          <li>Status tidak pernah hanya warna: selalu ada kata, tanda centang, atau angka.</li>
          <li>Label selalu terlihat di dalam kolom, bukan placeholder (3.3.2).</li>
          <li>Jumlah uang diucapkan dalam kata Indonesia untuk mencegah salah nol.</li>
          <li>Animasi 120 ms dan menjadi 0 ms saat pengaturan kurangi gerak aktif (2.3.3).</li>
          <li>Bahasa halaman <code>lang="id"</code>; tautan luar menyebut “buka di tab baru” (3.2.5).</li>
        </ul>
      </div>

      <h3 className="h-section">Batasan yang kami tahu</h3>
      <div className="card">
        <ul className="plain-list">
          <li>
            Pengujian sejauh ini otomatis (axe-core) dan pemeriksaan manual di peramban, <strong>belum</strong> uji
            dengan pembaca layar sungguhan (NVDA/TalkBack) bersama pengguna disabilitas.
          </li>
          <li>Antarmuka hanya berbahasa Indonesia; belum ada versi bahasa Inggris.</li>
          <li>Fitur AI (scan struk foto, tanya jawab model) butuh internet; versi tanpa AI tetap jalan.</li>
          <li>Grafik mingguan disajikan sebagai tabel agar terbaca pembaca layar; belum ada tampilan grafik visual.</li>
        </ul>
      </div>

      <h3 className="h-section">Butuh bantuan atau menemukan hambatan?</h3>
      <p className="support">
        Hubungi pendamping lewat tombol bantuan di pojok kanan atas setiap layar. Sebutkan layar yang bermasalah dan
        apa yang terjadi; hambatan akan dicatat sebagai temuan aksesibilitas.
      </p>

      <h3 className="h-section">Rujukan</h3>
      <div className="card">
        <ul className="plain-list">
          {REFS.map((ref) => (
            <li key={ref.href}>
              <a className="ext-link" href={ref.href} target="_blank" rel="noopener noreferrer">
                {ref.title}
                <span className="sr-only"> (buka di tab baru)</span>
              </a>
              <span className="list-sub"> {ref.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="support">
        Catatan: pernyataan aksesibilitas British Council menyebut situs mereka selaras WCAG 2.1 AA. Aplikasi ini
        menargetkan 2.2 AA, yang mencakup seluruh kriteria 2.1 AA ditambah sembilan kriteria baru.
      </p>
    </>
  );
}
