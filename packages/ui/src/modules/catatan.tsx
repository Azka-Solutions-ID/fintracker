import { useState } from "react";
import { Button } from "../Button";
import { MoneyInput } from "../MoneyInput";
import { formatRupiah, rupiahWords } from "../money";
import { sum, today, uid, type Kind } from "../store";
import { Empty, FieldLabel, Intro, Pair, Row, Rows, TextInput, kindOptions, type ModuleProps } from "./parts";

/* ---------------------------------------------------------------- Kategori */

export function KategoriModule({ book, v }: ModuleProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("keluar");
  const [note, setNote] = useState<string | null>(null);

  function add() {
    const clean = name.trim();
    if (!clean) return;
    if (book.categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
      setNote("Kategori dengan nama itu sudah ada.");
      return;
    }
    book.setCategories((prev) => [...prev, { id: uid(), name: clean, kind }]);
    setName("");
    setNote(`Kategori "${clean}" ditambahkan.`);
  }

  function remove(id: string) {
    const used = book.entries.some((entry) => entry.categoryId === id);
    if (used) {
      setNote("Kategori ini sudah dipakai di transaksi, jadi tidak dihapus. Riwayat harus tetap utuh.");
      return;
    }
    book.setCategories((prev) => prev.filter((c) => c.id !== id));
    setNote("Kategori dihapus.");
  }

  return (
    <>
      <Intro>
        Kategori dipakai untuk anggaran dan laporan. Kategori yang sudah dipakai transaksi tidak bisa dihapus, supaya
        riwayat tidak berubah.
      </Intro>

      <div className="module-form">
        <Pair legend="Jenis kategori" value={kind} onChange={(next) => setKind(next as Kind)} labels={kindOptions(v)} />
        <div className="field">
          <FieldLabel htmlFor="kategori-nama">Nama kategori</FieldLabel>
          <TextInput id="kategori-nama" value={name} onChange={setName} placeholder="Contoh: gas, kemasan, jasa antar" />
        </div>
        <div className="actionbar" style={{ marginTop: 0 }}>
          <Button variant="filled" onClick={add}>
            Tambah kategori
          </Button>
        </div>
        {note && (
          <p className="support" role="status">
            {note}
          </p>
        )}
      </div>

      <h3 className="h-section">Daftar kategori</h3>
      <div className="card card-tight">
        <ul className="list">
          {book.categories.map((category) => {
            const used = book.entries.filter((entry) => entry.categoryId === category.id).length;
            return (
              <li key={category.id}>
                <span className="list-main">{category.name}</span>
                <span className="pill">{category.kind === "masuk" ? v.masuk : v.keluar}</span>
                <span className="list-sub">
                  {used === 0 ? "Belum dipakai" : `Dipakai di ${used} transaksi`}
                </span>
                {used === 0 && (
                  <button type="button" className="link-danger" onClick={() => remove(category.id)}>
                    Hapus
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Utang & piutang */

export function UtangModule({ book }: ModuleProps) {
  const [type, setType] = useState<"utang" | "piutang">("utang");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");

  const value = Number(amount || "0");
  const openDebts = book.debts.filter((debt) => !debt.settled);
  const totalUtang = sum(openDebts.filter((d) => d.type === "utang"));
  const totalPiutang = sum(openDebts.filter((d) => d.type === "piutang"));

  function add() {
    if (!name.trim() || value <= 0) return;
    book.setDebts((prev) => [{ id: uid(), type, name: name.trim(), amount: value, due: due || undefined, settled: false }, ...prev]);
    setName("");
    setAmount("");
    setDue("");
  }

  return (
    <>
      <Intro>
        Dua arah: <strong>utang</strong> kalau kita yang berhutang, <strong>piutang</strong> kalau orang berhutang ke
        kita. Bon pelanggan masuk ke piutang.
      </Intro>

      <div className="module-form">
        <Pair
          legend="Jenis"
          value={type}
          onChange={(next) => setType(next === "piutang" ? "piutang" : "utang")}
          labels={[
            { id: "utang", label: "Saya berhutang" },
            { id: "piutang", label: "Orang berhutang" },
          ]}
        />

        <div className="field">
          <FieldLabel htmlFor="utang-nama">{type === "utang" ? "Kepada siapa" : "Siapa yang berhutang"}</FieldLabel>
          <TextInput id="utang-nama" value={name} onChange={setName} placeholder="Contoh: Pak Andi, supplier gas" />
        </div>

        <MoneyInput label="Jumlah" value={amount} onChange={setAmount} quick={[]} />

        <div className="field">
          <FieldLabel htmlFor="utang-jatuh">Jatuh tempo (boleh dikosongkan)</FieldLabel>
          <input
            id="utang-jatuh"
            className="module-input"
            type="date"
            value={due}
            onChange={(event) => setDue(event.target.value)}
          />
        </div>

        <div className="actionbar" style={{ marginTop: 0 }}>
          <Button variant="filled" onClick={add} disabled={value <= 0 || !name.trim()}>
            Catat {type === "utang" ? "utang" : "piutang"}
          </Button>
        </div>
        {(value <= 0 || !name.trim()) && <p className="field-hint">Isi nama dan jumlahnya dulu untuk menyimpan.</p>}
      </div>

      <Rows>
        <Row label="Utang belum lunas" value={formatRupiah(String(totalUtang))} />
        <Row label="Piutang belum tertagih" value={formatRupiah(String(totalPiutang))} />
        <Row label="Selisih" value={formatRupiah(String(totalPiutang - totalUtang))} strong />
      </Rows>

      <h3 className="h-section">Daftar</h3>
      {book.debts.length === 0 ? (
        <Empty>Belum ada catatan utang atau piutang.</Empty>
      ) : (
        <div className="card card-tight">
          <ul className="list">
            {book.debts.map((debt) => (
              <li key={debt.id} className={debt.settled ? "is-settled" : ""}>
                <span className="list-main">{debt.name}</span>
                <span className="pill">{debt.type === "utang" ? "Utang" : "Piutang"}</span>
                <span className="list-sub">
                  {formatRupiah(String(debt.amount))}
                  {debt.due ? ` · jatuh tempo ${debt.due}` : ""}
                  {debt.settled ? " · sudah lunas" : ""}
                </span>
                {!debt.settled && (
                  <button
                    type="button"
                    className="link-action"
                    onClick={() =>
                      book.setDebts((prev) => prev.map((item) => (item.id === debt.id ? { ...item, settled: true } : item)))
                    }
                  >
                    Tandai lunas
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Tujuan */

const GOAL_CHIPS = [50_000, 100_000, 250_000];

export function TujuanModule({ book }: ModuleProps) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [topUpId, setTopUpId] = useState<string | null>(null);
  const [topUp, setTopUp] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const targetValue = Number(target || "0");

  function add() {
    if (!name.trim() || targetValue <= 0) return;
    book.setGoals((prev) => [...prev, { id: uid(), name: name.trim(), target: targetValue, saved: 0 }]);
    setName("");
    setTarget("");
    setNote("Tujuan ditambahkan. Mulai menabung kapan saja.");
  }

  function addTo(goalId: string, amount: number) {
    if (amount <= 0) return;
    book.setGoals((prev) =>
      prev.map((goal) => (goal.id === goalId ? { ...goal, saved: Math.min(goal.target, goal.saved + amount) } : goal)),
    );
    setTopUp("");
    setTopUpId(null);
  }

  return (
    <>
      <Intro>
        Tujuan membuat menabung punya angka. Contoh: beli etalase Rp 1.500.000, dana darurat Rp 3.000.000.
      </Intro>

      <div className="module-form">
        <div className="field">
          <FieldLabel htmlFor="tujuan-nama">Nama tujuan</FieldLabel>
          <TextInput id="tujuan-nama" value={name} onChange={setName} placeholder="Contoh: etalase baru" />
        </div>
        <MoneyInput label="Target" value={target} onChange={setTarget} quick={[]} />
        <div className="actionbar" style={{ marginTop: 0 }}>
          <Button variant="filled" onClick={add} disabled={targetValue <= 0 || !name.trim()}>
            Tambah tujuan
          </Button>
        </div>
        {(targetValue <= 0 || !name.trim()) && <p className="field-hint">Isi nama tujuan dan targetnya dulu.</p>}
        {note && (
          <p className="support" role="status">
            {note}
          </p>
        )}
      </div>

      <h3 className="h-section">Tujuan berjalan</h3>
      {book.goals.length === 0 ? (
        <Empty>Belum ada tujuan. Satu saja cukup untuk mulai.</Empty>
      ) : (
        <div className="card">
          {book.goals.map((goal) => {
            const percent = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
            const finished = goal.saved >= goal.target;
            return (
              <div className="goal" key={goal.id}>
                <p className="budget-name">
                  {goal.name} {finished ? "✓" : ""}
                </p>
                <p className="budget-amount">
                  {formatRupiah(String(goal.saved))} dari {formatRupiah(String(goal.target))} — {percent}%
                </p>
                <div className="meter" aria-hidden="true">
                  <span className="meter-fill" style={{ width: `${percent}%` }} />
                </div>

                {!finished && (
                  <>
                    <p className="module-label">Tambah tabungan</p>
                    <div className="chips">
                      {GOAL_CHIPS.map((chip) => (
                        <button key={chip} type="button" className="chip" onClick={() => addTo(goal.id, chip)}>
                          + {chip / 1000} rb
                        </button>
                      ))}
                    </div>
                    <div className="actionbar" style={{ marginTop: "var(--gap)" }}>
                      {topUpId === goal.id ? (
                        <>
                          <MoneyInput label="Jumlah lain" value={topUp} onChange={setTopUp} quick={[]} />
                          <Button variant="filled" onClick={() => addTo(goal.id, Number(topUp || "0"))}>
                            Tambahkan
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" onClick={() => setTopUpId(goal.id)}>
                          Isi jumlah lain
                        </Button>
                      )}
                    </div>
                  </>
                )}
                {finished && <p className="support">Terkumpul penuh. Sisa {rupiahWords(String(goal.target))} sudah siap dipakai.</p>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Kas kecil: saldo */

export function saldoText(book: ModuleProps["book"]) {
  const masuk = sum(book.entries.filter((entry) => entry.kind === "masuk"));
  const keluar = sum(book.entries.filter((entry) => entry.kind === "keluar"));
  return formatRupiah(String(masuk - keluar));
}

export const TODAY = today;
