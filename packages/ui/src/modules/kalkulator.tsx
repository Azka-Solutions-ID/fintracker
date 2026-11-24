import { useState } from "react";
import { MoneyInput } from "../MoneyInput";
import { formatRupiah } from "../money";
import { monthSpent, sum } from "../store";
import { FieldLabel, Intro, Row, Rows, TextInput, type ModuleProps } from "./parts";

/* ---------------------------------------------------------------- HPP (UMKM) */

const MARGINS = [20, 30, 40, 50];

function roundUpTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

/** Harga jual supaya tidak rugi. Satu porsi: bahan + tenaga + kemasan, dibagi jumlah porsi. */
export function HppModule(_props: ModuleProps) {
  const [bahan, setBahan] = useState("");
  const [tenaga, setTenaga] = useState("");
  const [kemasan, setKemasan] = useState("");
  const [porsi, setPorsi] = useState("10");
  const [margin, setMargin] = useState(30);

  const totalBiaya = Number(bahan || "0") + Number(tenaga || "0") + Number(kemasan || "0");
  const jumlah = Math.max(1, Number(porsi || "1"));
  const hpp = Math.round(totalBiaya / jumlah);
  const harga = hpp > 0 ? roundUpTo(hpp / (1 - margin / 100), 500) : 0;
  const laba = harga - hpp;

  return (
    <>
      <Intro>
        Hitung harga jual dari biaya nyata. Isi biaya untuk satu kali produksi, lalu jumlah porsinya. Hasilnya harga
        per porsi.
      </Intro>

      <div className="module-form">
        <MoneyInput label="Biaya bahan" value={bahan} onChange={setBahan} quick={[]} />
        <MoneyInput label="Biaya tenaga kerja" value={tenaga} onChange={setTenaga} quick={[]} />
        <MoneyInput label="Biaya kemasan" value={kemasan} onChange={setKemasan} quick={[]} />

        <div className="field">
          <FieldLabel htmlFor="hpp-porsi">Jumlah porsi dari bahan ini</FieldLabel>
          <TextInput id="hpp-porsi" value={porsi} onChange={setPorsi} inputMode="numeric" />
        </div>

        <p className="module-label">Ambil untung berapa persen?</p>
        <div className="chips">
          {MARGINS.map((option) => (
            <button
              key={option}
              type="button"
              className="chip"
              aria-pressed={margin === option}
              onClick={() => setMargin(option)}
            >
              {margin === option ? "✓ " : ""}
              {option}%
            </button>
          ))}
        </div>
      </div>

      <Rows>
        <Row label="Total biaya sekali produksi" value={formatRupiah(String(totalBiaya))} />
        <Row label={`HPP per porsi (${jumlah} porsi)`} value={formatRupiah(String(hpp))} />
        <Row label={`Harga jual saran (+${margin}%)`} value={formatRupiah(String(harga))} strong />
        <Row label="Untung per porsi" value={formatRupiah(String(laba))} />
      </Rows>

      <p className="support">
        Rumus: HPP = (bahan + tenaga + kemasan) ÷ jumlah porsi. Harga jual = HPP ÷ (1 − {margin / 100}), dibulatkan ke
        atas per 500 rupiah supaya mudah diucapkan.
      </p>
    </>
  );
}

/* ---------------------------------------------------------------- 50/30/20 (Pekerja) */

export function LimaTigaDuaModule({ book }: ModuleProps) {
  const [income, setIncome] = useState("");
  const value = Number(income || "0");
  const kebutuhan = Math.round(value * 0.5);
  const keinginan = Math.round(value * 0.3);
  const tabungan = value - kebutuhan - keinginan;
  const realKeluar = monthSpent(book.entries);

  return (
    <>
      <Intro>
        Aturan 50/30/20 membagi penghasilan: 50% kebutuhan, 30% keinginan, 20% ditabung. Dipakai sebagai patokan, bukan
        aturan mati.
      </Intro>

      <MoneyInput label="Penghasilan sebulan" value={income} onChange={setIncome} quick={[]} />

      <Rows>
        <Row label="Kebutuhan (50%)" value={formatRupiah(String(kebutuhan))} />
        <Row label="Keinginan (30%)" value={formatRupiah(String(keinginan))} />
        <Row label="Ditabung (20%)" value={formatRupiah(String(tabungan))} strong />
        <Row label="Pengeluaran tercatat bulan ini" value={formatRupiah(String(realKeluar))} />
      </Rows>

      {value > 0 && (
        <p className="support">
          {realKeluar === 0
            ? "Belum ada pengeluaran bulan ini. Setelah mencatat beberapa hari, bandingkan dengan angka di atas."
            : realKeluar <= kebutuhan
              ? `Pengeluaran masih di bawah porsi kebutuhan. Sisa ruang ${formatRupiah(String(kebutuhan - realKeluar))}.`
              : realKeluar <= kebutuhan + keinginan
                ? "Pengeluaran sudah melewati porsi kebutuhan dan masuk ke porsi keinginan. Cek kategori yang paling besar."
                : "Pengeluaran melewati 80% penghasilan. Ini tanda perlu memangkas atau menambah pemasukan."}
        </p>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Cicilan aman (Pekerja) */

export function CicilanModule(_props: ModuleProps) {
  const [income, setIncome] = useState("");
  const [installment, setInstallment] = useState("");

  const incomeValue = Number(income || "0");
  const installmentValue = Number(installment || "0");
  const maxSafe = Math.round(incomeValue * 0.3);
  const ratio = incomeValue > 0 ? Math.round((installmentValue / incomeValue) * 100) : 0;
  const verdict =
    incomeValue === 0
      ? "Isi penghasilan dulu."
      : installmentValue === 0
        ? "Isi cicilan per bulan yang sedang dijalani."
        : ratio <= 30
          ? "Masih aman."
          : ratio <= 40
            ? "Mulai berat. Sisakan ruang untuk kejutan."
            : "Terlalu berat. Pertimbangkan menunda atau memperpanjang.";

  return (
    <>
      <Intro>
        Patokan umum: total cicilan sebaiknya tidak lebih dari 30% penghasilan bulanan. Angka ini dipakai bank dan
        aplikasi paylater sebagai batas aman.
      </Intro>

      <MoneyInput label="Penghasilan sebulan" value={income} onChange={setIncome} quick={[]} />
      <MoneyInput label="Total cicilan per bulan" value={installment} onChange={setInstallment} quick={[]} />

      <Rows>
        <Row label="Batas aman (30%)" value={formatRupiah(String(maxSafe))} strong />
        <Row label="Cicilan sekarang" value={formatRupiah(String(installmentValue))} />
        <Row label="Porsi penghasilan" value={incomeValue > 0 ? `${ratio}%` : "—"} />
      </Rows>

      <p className="support">{verdict}</p>
    </>
  );
}

/* ---------------------------------------------------------------- ringkasan cepat */

export function quickSummary(entries: ModuleProps["book"]["entries"]) {
  return {
    masuk: sum(entries.filter((e) => e.kind === "masuk")),
    keluar: sum(entries.filter((e) => e.kind === "keluar")),
  };
}
