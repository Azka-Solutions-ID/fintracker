import { useMemo, useState } from "react";
import { Button } from "../Button";
import { MoneyInput } from "../MoneyInput";
import { formatRupiah, rupiahWords } from "../money";
import {
  cycleInfo,
  monthSpent,
  spentByCategory,
  sum,
  today,
  uid,
  weeklySeries,
  type Entry,
} from "../store";
import { Empty, Intro, Meter, Pair, Row, Rows, Select, TextInput, FieldLabel, type ModuleProps } from "./parts";

/* ---------------------------------------------------------------- Anggaran */

export function AnggaranModule({ book }: ModuleProps) {
  const outCategories = book.categories.filter((c) => c.kind === "keluar");
  const [categoryId, setCategoryId] = useState(outCategories[0]?.id ?? "");
  const [limit, setLimit] = useState("");
  const [saved, setSaved] = useState(false);

  const value = Number(limit || "0");

  function add() {
    if (!categoryId || value <= 0) return;
    book.setBudgets((prev) => [
      ...prev.filter((budget) => budget.categoryId !== categoryId),
      { id: uid(), categoryId, limit: value },
    ]);
    setLimit("");
    setSaved(true);
  }

  return (
    <>
      <Intro>
        Batas belanja per kategori untuk bulan ini. Angka disimpan di perangkat ini, jadi tetap ada saat aplikasi
        dibuka lagi.
      </Intro>

      <div className="module-form">
        <div className="field">
          <FieldLabel htmlFor="anggaran-kategori">Kategori belanja</FieldLabel>
          <Select
            id="anggaran-kategori"
            value={categoryId}
            onChange={setCategoryId}
            options={outCategories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>

        <MoneyInput label="Batas belanja" value={limit} onChange={setLimit} quick={[]} />

        <div className="actionbar" style={{ marginTop: 0 }}>
          <Button variant="filled" onClick={add} disabled={value <= 0 || !categoryId}>
            Simpan anggaran
          </Button>
        </div>
        {value <= 0 && <p className="field-hint">Isi batas belanjanya dulu untuk menyimpan.</p>}
        {saved && (
          <p className="support" role="status">
            Anggaran tersimpan: {rupiahWords(String(value))} untuk kategori terpilih.
          </p>
        )}
      </div>

      <h3 className="h-section">Yang sedang berjalan</h3>
      {book.budgets.length === 0 ? (
        <Empty>Belum ada anggaran. Mulai dari kategori yang paling sering keluar, misalnya bahan baku.</Empty>
      ) : (
        <div className="card">
          {book.budgets.map((budget) => {
            const category = book.categories.find((c) => c.id === budget.categoryId);
            const used = monthSpent(book.entries.filter((e) => e.categoryId === budget.categoryId));
            return (
              <div className="budget" key={budget.id}>
                <p className="budget-name">{category?.name ?? "Kategori terhapus"}</p>
                <p className="budget-amount">
                  {formatRupiah(String(used))} dari {formatRupiah(String(budget.limit))}
                </p>
                <Meter used={used} limit={budget.limit} label="Terpakai bulan ini" />
                <button
                  type="button"
                  className="link-danger"
                  onClick={() => book.setBudgets((prev) => prev.filter((b) => b.id !== budget.id))}
                >
                  Hapus anggaran
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Grafik mingguan */

export function GrafikModule({ book }: ModuleProps) {
  const week = useMemo(() => weeklySeries(book.entries), [book.entries]);
  const peak = Math.max(...week.map((day) => Math.max(day.masuk, day.keluar)), 1);
  const weekTotals = week.reduce(
    (acc, day) => ({ masuk: acc.masuk + day.masuk, keluar: acc.keluar + day.keluar }),
    { masuk: 0, keluar: 0 },
  );

  return (
    <>
      <Intro>Tujuh hari terakhir, Senin sampai Minggu. Setiap batang punya angkanya sendiri.</Intro>

      {/* A table, not a canvas: the numbers are the content, the bars are decoration. */}
      <table className="chart-table">
        <caption className="sr-only">Uang masuk dan keluar per hari, Senin sampai Minggu</caption>
        <thead>
          <tr>
            <th scope="col">Hari</th>
            <th scope="col">Masuk</th>
            <th scope="col">Keluar</th>
          </tr>
        </thead>
        <tbody>
          {week.map((day) => (
            <tr key={day.date} className={day.date === today() ? "chart-today" : ""}>
              <th scope="row">
                {day.label}
                {day.date === today() ? " (hari ini)" : ""}
              </th>
              <td>
                <span className="chart-bar-cell">
                  <span className="chart-bar chart-in" style={{ width: `${(day.masuk / peak) * 100}%` }} aria-hidden="true" />
                  <span className="chart-value">{day.masuk ? formatRupiah(String(day.masuk)) : "—"}</span>
                </span>
              </td>
              <td>
                <span className="chart-bar-cell">
                  <span className="chart-bar chart-out" style={{ width: `${(day.keluar / peak) * 100}%` }} aria-hidden="true" />
                  <span className="chart-value">{day.keluar ? formatRupiah(String(day.keluar)) : "—"}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Rows>
        <Row label="Masuk seminggu" value={formatRupiah(String(weekTotals.masuk))} />
        <Row label="Keluar seminggu" value={formatRupiah(String(weekTotals.keluar))} />
        <Row label="Selisih seminggu" value={formatRupiah(String(weekTotals.masuk - weekTotals.keluar))} strong />
      </Rows>
    </>
  );
}

/* ---------------------------------------------------------------- Kesehatan */

export function KesehatanModule({ book }: ModuleProps) {
  const saldo = book.entries.reduce((total, entry) => {
    return total + (entry.kind === "masuk" ? entry.amount : -entry.amount);
  }, 0);

  // computed inline so the score always follows the latest entries
  const totalsIn = sum(book.entries.filter((e) => e.kind === "masuk"));
  const totalsOut = sum(book.entries.filter((e) => e.kind === "keluar"));
  const openDebt = sum(book.debts.filter((d) => !d.settled && d.type === "utang"));

  const parts: { label: string; verdict: string; detail: string; points: number; max: number }[] = [];
  if (totalsIn > 0) {
    const ratio = totalsOut / totalsIn;
    parts.push({
      label: "Belanja vs pemasukan",
      verdict: ratio <= 0.7 ? "Aman" : ratio <= 0.9 ? "Waspada" : "Bahaya",
      detail: `Belanja ${Math.round(ratio * 100)}% dari pemasukan.`,
      points: ratio <= 0.7 ? 40 : ratio <= 0.9 ? 24 : 8,
      max: 40,
    });
  } else {
    parts.push({
      label: "Belanja vs pemasukan",
      verdict: "Belum ada data",
      detail: "Catat pemasukan dulu.",
      points: 0,
      max: 40,
    });
  }
  if (openDebt > 0) {
    const ratio = openDebt / Math.max(1, totalsIn);
    parts.push({
      label: "Utang",
      verdict: ratio <= 0.3 ? "Masih aman" : ratio <= 0.6 ? "Berat" : "Terlalu berat",
      detail: `${formatRupiah(String(openDebt))} = ${Math.round(ratio * 100)}% dari pemasukan.`,
      points: ratio <= 0.3 ? 30 : ratio <= 0.6 ? 18 : 6,
      max: 40,
    });
  } else {
    parts.push({ label: "Utang", verdict: "Aman", detail: "Tidak ada utang tercatat.", points: 40, max: 40 });
  }
  parts.push({
    label: "Sisa uang",
    verdict: saldo > 0 ? "Ada sisa" : "Kosong",
    detail: `Saldo semua dompet ${formatRupiah(String(saldo))}.`,
    points: saldo > 0 ? 20 : 0,
    max: 20,
  });

  const score = parts.reduce((total, part) => total + part.points, 0);
  const label = score >= 80 ? "Sehat" : score >= 55 ? "Cukup" : score >= 30 ? "Perlu dibenahi" : "Belum terkendali";

  return (
    <>
      <Intro>
        Skor dihitung dari tiga hal sederhana: porsi belanja, utang, dan sisa uang. Rumusnya ditulis di bawah supaya
        bisa dijelaskan ke peserta.
      </Intro>

      <div className="score-card">
        <p className="score-number">{score}</p>
        <p className="score-label">dari 100 — {label}</p>
      </div>

      <div className="card">
        {parts.map((part) => (
          <div className="health-part" key={part.label}>
            <p className="health-head">
              <span className="health-name">{part.label}</span>
              <span className="pill">
                {part.verdict} · {part.points}/{part.max}
              </span>
            </p>
            <p className="health-detail">{part.detail}</p>
          </div>
        ))}
      </div>

      <h3 className="h-section">Cara membacanya</h3>
      <p className="support">
        80 ke atas sehat, 55–79 cukup, 30–54 perlu dibenahi, di bawah 30 belum terkendali. Skornya alat bantu
        mengobrol, bukan vonis.
      </p>
    </>
  );
}

/* ---------------------------------------------------------------- Siklus gajian */

export function GajianModule({ book }: ModuleProps) {
  const info = cycleInfo(book.cycle, book.entries);

  return (
    <>
      <Intro>Menentukan batas belanja harian dari sisa uang dan sisa hari. Pilih siklus yang dipakai sehari-hari.</Intro>

      <Pair
        legend="Siklus"
        value={book.cycle.period}
        onChange={(value) => book.setCycle({ ...book.cycle, period: value === "mingguan" ? "mingguan" : "bulanan" })}
        labels={[
          { id: "mingguan", label: "Mingguan" },
          { id: "bulanan", label: "Bulanan" },
        ]}
      />

      <Rows>
        <Row label="Siklus" value={info.title} />
        <Row label="Posisi" value={info.position} />
        <Row label="Sisa hari" value={`${info.left} hari`} />
        <Row label="Sudah keluar" value={formatRupiah(String(info.spent))} />
        <Row label="Batas belanja per hari" value={formatRupiah(String(info.dailyBudget))} strong />
      </Rows>

      <p className="support">
        Batas harian = (pemasukan − yang sudah keluar) ÷ sisa hari. Angka ini panduan, bukan larangan: kalau lewat,
        catat saja apa adanya.
      </p>
    </>
  );
}

/* ---------------------------------------------------------------- Badge */

export function BadgeModule({ book }: ModuleProps) {
  const badges = useMemo(() => {
    const days = new Set(book.entries.map((e) => e.date));
    const keptBudget = book.budgets.some((budget) => {
      const used = sum(book.entries.filter((e) => e.categoryId === budget.categoryId && e.kind === "keluar"));
      return used > 0 && used <= budget.limit;
    });
    return [
      { id: "first", name: "Catatan pertama", note: "Satu transaksi tercatat", rule: "1 transaksi", earned: book.entries.length >= 1 },
      { id: "five", name: "Lima transaksi", note: "Syarat rubrik modul 3", rule: "5 transaksi", earned: book.entries.length >= 5 },
      { id: "ten", name: "Rajin mencatat", note: "Sepuluh transaksi", rule: "10 transaksi", earned: book.entries.length >= 10 },
      { id: "three-days", name: "Tiga hari berturut", note: "Mencatat di tiga hari berbeda", rule: "3 hari", earned: days.size >= 3 },
      { id: "budget", name: "Belanja terkendali", note: "Ada kategori yang tetap di bawah anggaran", rule: "anggaran dijaga", earned: keptBudget },
      {
        id: "debt-free",
        name: "Bebas utang",
        note: "Semua utang sudah dilunasi",
        rule: "utang 0",
        earned: book.debts.length > 0 && book.debts.every((d) => d.settled),
      },
      {
        id: "goal",
        name: "Tujuan tercapai",
        note: "Satu tujuan sudah terkumpul penuh",
        rule: "target tercapai",
        earned: book.goals.some((g) => g.target > 0 && g.saved >= g.target),
      },
    ];
  }, [book.entries, book.budgets, book.debts, book.goals]);

  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <>
      <Intro>
        {earned} dari {badges.length} pencapaian terbuka. Setiap pencapaian menyebut syaratnya dengan angka, jadi
        jelas cara mendapatkannya.
      </Intro>
      <div className="card card-tight">
        <ul className="list">
          {badges.map((badge) => (
            <li key={badge.id}>
              <span className="list-main">
                {badge.earned ? "✓ " : "○ "}
                {badge.name}
              </span>
              <span className={badge.earned ? "pill pill-earned" : "pill"}>{badge.earned ? "Sudah" : "Belum"}</span>
              <span className="list-sub">
                {badge.note} · syarat: {badge.rule}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Ekspor */

function toCsv(entries: Entry[], book: ModuleProps["book"]): string {
  const header = ["tanggal", "jenis", "dompet", "kategori", "jumlah", "keterangan"];
  const rows = entries.map((entry) => [
    entry.date,
    entry.kind,
    entry.walletId,
    book.categories.find((c) => c.id === entry.categoryId)?.name ?? "",
    String(entry.amount),
    (entry.note ?? "").replace(/"/g, '""'),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\r\n");
}

export function EksporModule({ book }: ModuleProps) {
  const [done, setDone] = useState<string | null>(null);

  function downloadCsv() {
    if (book.entries.length === 0) {
      setDone("Belum ada transaksi untuk diekspor.");
      return;
    }
    const blob = new Blob([`\ufeff${toCsv(book.entries, book)}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `catatan-keuangan-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setDone(`${book.entries.length} transaksi diunduh sebagai CSV. Bisa dibuka di Excel.`);
  }

  return (
    <>
      <Intro>Data ini milik pengguna. Ekspor dipakai untuk arsip, laporan ke pendamping, atau membuka di Excel.</Intro>

      <div className="card">
        <p className="row">
          <span className="row-label">Jumlah transaksi</span>
          <span className="amount">{book.entries.length}</span>
        </p>
        <p className="row">
          <span className="row-label">Total nilai</span>
          <span className="amount">{formatRupiah(String(sum(book.entries)))}</span>
        </p>
      </div>

      <div className="actionbar">
        <Button variant="filled" onClick={downloadCsv}>
          Unduh CSV
        </Button>
      </div>
      <div className="actionbar" style={{ marginTop: "var(--gap)" }}>
        <Button variant="outline" onClick={() => window.print()}>
          Cetak / simpan PDF
        </Button>
      </div>

      {done && (
        <p className="support" role="status">
          {done}
        </p>
      )}
      <p className="support">
        Tombol cetak memakai dialog cetak perangkat: pilih "Simpan sebagai PDF" untuk berkas PDF tanpa aplikasi
        tambahan.
      </p>
    </>
  );
}

/* ---------------------------------------------------------------- small shared bits */

export function addEntry(book: ModuleProps["book"], entry: Omit<Entry, "id" | "date">) {
  book.setEntries((prev) => [{ ...entry, id: uid(), date: today() }, ...prev]);
}

export function categoryUsage(book: ModuleProps["book"], id: string) {
  return spentByCategory(book.entries, id);
}

export function TextRow({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <TextInput id={id} value={value} onChange={onChange} />
    </div>
  );
}
