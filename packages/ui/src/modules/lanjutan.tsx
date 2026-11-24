import { useState } from "react";
import { Button } from "../Button";
import { MoneyInput } from "../MoneyInput";
import { formatRupiah, rupiahWords } from "../money";
import { answerQuestion, parseReceipt, splitBill, type Receipt } from "../lanjutan-logic";
import { sum, today, uid, type Entry } from "../store";
import { useQueue } from "../queue";
import { aiConfigured, askAi, fileToDataUrl, readReceiptAi } from "../ai";
import { Empty, FieldLabel, Intro, Row, Rows, Select, TextInput, type ModuleProps } from "./parts";

/* ---------------------------------------------------------------- Scan struk (tanpa AI) */

/** No camera model, no key: the receipt is read by rules from text the user can see and correct.
    The brief allows AI here only if there is a path that works without it — this is that path. */
export function ScanStrukModule({ book, walletIds }: ModuleProps) {
  const [text, setText] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [wallet, setWallet] = useState(walletIds[0] ?? "usaha");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const categories = book.categories.filter((item) => item.kind === "keluar");

  /** The model fills the same fields the user already edits; nothing is saved without a tap. */
  function applyReceipt(
    result: { merchant: string | null; total: number | null; date: string | null },
    model: string,
  ) {
    if (result.total) setAmount(String(result.total));
    if (result.date) setDate(result.date);
    if (result.merchant) setNote(result.merchant);
    setSaved(
      result.total
        ? `AI terbaca (${model}): ${formatRupiah(String(result.total))}${result.merchant ? ` dari ${result.merchant}` : ""}. Cek dulu sebelum menyimpan.`
        : `AI (${model}) tidak menemukan totalnya. Isi manual di bawah.`,
    );
  }

  async function readWithAi() {
    setBusy(true);
    setSaved(null);
    try {
      const result = await readReceiptAi({ text });
      applyReceipt(result, result.model);
    } catch (error) {
      setSaved(error instanceof Error ? `AI gagal: ${error.message}` : "AI gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function readPhoto(file: File) {
    setBusy(true);
    setSaved(null);
    try {
      const image = await fileToDataUrl(file);
      const result = await readReceiptAi({ image });
      applyReceipt(result, result.model);
      setReceipt({
        amount: result.total ?? undefined,
        date: result.date ?? undefined,
        merchant: result.merchant ?? undefined,
        candidates: [],
      });
    } catch (error) {
      setSaved(error instanceof Error ? `Foto gagal dibaca: ${error.message}` : "Foto gagal dibaca.");
    } finally {
      setBusy(false);
    }
  }
  const value = Number(amount || "0");

  function read() {
    const parsed = parseReceipt(text);
    setReceipt(parsed);
    setAmount(parsed.amount ? String(parsed.amount) : "");
    if (parsed.date) setDate(parsed.date);
    if (parsed.merchant) setNote(parsed.merchant);
    if (!parsed.amount) setSaved("Tidak ada angka yang terbaca. Isi jumlahnya sendiri di bawah.");
  }

  function save() {
    if (value <= 0) return;
    const entry: Entry = {
      id: uid(),
      kind: "keluar",
      walletId: wallet,
      amount: value,
      note: note.trim() || undefined,
      categoryId: category || undefined,
      date,
    };
    book.setEntries((prev) => [entry, ...prev]);
    setSaved(`Tersimpan: ${rupiahWords(String(value))}.`);
    setText("");
    setReceipt(null);
    setAmount("");
    setNote("");
  }

  return (
    <>
      <Intro>
        Tempel atau tulis isi struk di kotak bawah. Angka totalnya dibaca di perangkat ini — tanpa internet, tanpa
        kirim foto ke mana pun. Semua hasil bisa diperbaiki sebelum disimpan.
      </Intro>

      <div className="module-form">
        <div className="field">
          <FieldLabel htmlFor="struk-teks">Isi struk</FieldLabel>
          <textarea
            id="struk-teks"
            className="module-textarea"
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={"Toko Sumber Rejeki\n22/11/2026\nBeras 5kg   85.000\nMinyak 2L   40.000\nTOTAL       125.000"}
          />
          <p className="field-hint">Satu baris satu item. Baris berisi kata "total" dipakai sebagai patokan.</p>
        </div>

        <div className="actionbar" style={{ marginTop: 0 }}>
          <Button variant="outline" onClick={read} disabled={text.trim().length < 3}>
            Baca tanpa AI
          </Button>
        </div>

        {aiConfigured() && (
          <>
            <div className="actionbar" style={{ marginTop: "var(--gap)" }}>
              <Button variant="filled" onClick={readWithAi} disabled={busy || text.trim().length < 3}>
                {busy ? "Membaca..." : "Baca dengan AI"}
              </Button>
            </div>

            <div className="field">
              <label className="module-label" htmlFor="struk-foto">
                Atau foto struknya
              </label>
              <input
                id="struk-foto"
                className="module-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readPhoto(file);
                }}
              />
              <p className="field-hint">Foto dikecilkan di perangkat dulu, lalu dibaca model penglihatan.</p>
            </div>
          </>
        )}

        {receipt && (
          <>
            <p className="support" role="status">
              {receipt.amount
                ? `Terbaca ${formatRupiah(String(receipt.amount))}${receipt.merchant ? ` dari ${receipt.merchant}` : ""}. Cek dulu sebelum menyimpan.`
                : "Angkanya belum ketemu. Isi manual di bawah."}
            </p>

            {receipt.candidates.length > 1 && (
              <>
                <p className="module-label">Angka lain di struk (ketuk untuk memakai)</p>
                <div className="chips">
                  {receipt.candidates.map((candidate) => (
                    <button
                      key={candidate}
                      type="button"
                      className="chip"
                      aria-pressed={value === candidate}
                      onClick={() => setAmount(String(candidate))}
                    >
                      {value === candidate ? "✓ " : ""}
                      {candidate.toLocaleString("id-ID")}
                    </button>
                  ))}
                </div>
              </>
            )}

            <MoneyInput label="Jumlah yang dicatat" value={amount} onChange={setAmount} quick={[]} />

            <div className="field">
              <FieldLabel htmlFor="struk-tanggal">Tanggal</FieldLabel>
              <input
                id="struk-tanggal"
                className="module-input"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="field">
              <FieldLabel htmlFor="struk-dompet">Dompet</FieldLabel>
              <Select
                id="struk-dompet"
                value={wallet}
                onChange={setWallet}
                options={[
                  { value: "usaha", label: "Kas Usaha" },
                  { value: "dapur", label: "Dompet Dapur" },
                ]}
              />
            </div>

            <div className="field">
              <FieldLabel htmlFor="struk-kategori">Kategori</FieldLabel>
              <Select
                id="struk-kategori"
                value={category}
                onChange={setCategory}
                options={[{ value: "", label: "Tanpa kategori" }, ...categories.map((item) => ({ value: item.id, label: item.name }))]}
              />
            </div>

            <div className="field">
              <FieldLabel htmlFor="struk-catatan">Keterangan</FieldLabel>
              <TextInput id="struk-catatan" value={note} onChange={setNote} />
            </div>

            <div className="actionbar" style={{ marginTop: 0 }}>
              <Button variant="filled" onClick={save} disabled={value <= 0}>
                Simpan sebagai pengeluaran
              </Button>
            </div>
          </>
        )}

        {saved && (
          <p className="support" role="status">
            {saved}
          </p>
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Tanya catatan (tanpa AI) */

const EXAMPLES = [
  "Berapa untung hari ini?",
  "Pengeluaran terbesar apa?",
  "Sisa dompet berapa?",
  "Sisa anggaran berapa?",
  "Utang saya berapa?",
  "Berapa transaksi tercatat?",
];

export function TanyaModule({ book, walletIds, v }: ModuleProps) {
  const [question, setQuestion] = useState("");
  const [log, setLog] = useState<{ q: string; a: string; source?: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const masuk = sum(book.entries.filter((entry) => entry.kind === "masuk"));
  const keluar = sum(book.entries.filter((entry) => entry.kind === "keluar"));
  const wallets = walletIds.map((id) => {
    const owned = book.entries.filter((entry) => entry.walletId === id);
    return {
      name: id === "dapur" ? "Dompet Dapur" : id === "kerja" ? "Uang Kerja" : id === "pribadi" ? "Uang Pribadi" : "Kas Usaha",
      saldo:
        sum(owned.filter((entry) => entry.kind === "masuk")) - sum(owned.filter((entry) => entry.kind === "keluar")),
    };
  });

  function ask(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const answer = answerQuestion(clean, {
      masuk,
      keluar,
      selisih: masuk - keluar,
      entries: book.entries.map((entry) => ({ amount: entry.amount, kind: entry.kind, categoryId: entry.categoryId })),
      wallets,
      categories: book.categories,
      budgets: book.budgets,
      debts: book.debts,
      goals: book.goals,
    });
    setLog((prev) => [{ q: clean, a: answer.text, source: "dihitung di perangkat" }, ...prev].slice(0, 6));
    setQuestion("");
  }

  async function askModel() {
    const clean = question.trim();
    if (!clean) return;
    setBusy(true);
    try {
      const reply = await askAi(clean, {
        masuk,
        keluar,
        selisih: masuk - keluar,
        dompet: wallets,
        anggaran: book.budgets.map((budget) => ({
          kategori: book.categories.find((category) => category.id === budget.categoryId)?.name ?? "lain",
          batas: budget.limit,
        })),
        utang: book.debts
          .filter((debt) => !debt.settled)
          .map((debt) => ({ jenis: debt.type, jumlah: debt.amount })),
        tujuan: book.goals.map((goal) => ({ nama: goal.name, target: goal.target, terkumpul: goal.saved })),
        jumlah_transaksi: book.entries.length,
      });
      setLog((prev) => [{ q: clean, a: reply.answer, source: reply.model }, ...prev].slice(0, 6));
      setQuestion("");
    } catch (error) {
      setLog(
        (prev) =>
          [
            {
              q: clean,
              a: error instanceof Error ? `AI gagal: ${error.message}` : "AI gagal menjawab.",
              source: "AI error",
            },
            ...prev,
          ].slice(0, 6),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Intro>
        Jawaban dihitung dari catatan di perangkat ini — {v.masuk.toLowerCase()}, {v.keluar.toLowerCase()}, dompet,
        anggaran, utang, dan tujuan. Tidak ada model bahasa, jadi jawabannya selalu bisa ditelusuri.
      </Intro>

      <div className="module-form">
        <div className="field">
          <FieldLabel htmlFor="tanya-pertanyaan">Pertanyaan</FieldLabel>
          <TextInput
            id="tanya-pertanyaan"
            value={question}
            onChange={setQuestion}
            placeholder="Contoh: berapa untung hari ini?"
          />
        </div>
        <div className="actionbar" style={{ marginTop: 0 }}>
          <Button variant="outline" onClick={() => ask(question)} disabled={!question.trim()}>
            Hitung sendiri
          </Button>
        </div>
        {aiConfigured() && (
          <div className="actionbar" style={{ marginTop: "var(--gap)" }}>
            <Button variant="filled" onClick={askModel} disabled={busy || !question.trim()}>
              {busy ? "Menunggu model..." : "Tanya AI"}
            </Button>
          </div>
        )}
        {!question.trim() && <p className="field-hint">Ketik pertanyaan, atau ketuk contoh di bawah.</p>}

        <p className="module-label">Pertanyaan yang bisa dijawab</p>
        <div className="chips chips-wrap">
          {EXAMPLES.map((example) => (
            <button key={example} type="button" className="chip" onClick={() => ask(example)}>
              {example}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        {log.length === 0 ? (
          <Empty>Belum ada pertanyaan. Ketuk salah satu contoh di atas untuk mencoba.</Empty>
        ) : (
          log.map((item, index) => (
            <div className="card" key={`${item.q}-${index}`} style={{ marginBottom: "var(--gap)" }}>
              <p className="chat-q">{item.q}</p>
              <p className="chat-a">{item.a}</p>
              {item.source && <p className="ai-badge">sumber: {item.source}</p>}
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Split bill (pekerja) */

export function SplitBillModule(_props: ModuleProps) {
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState("2");
  const [tip, setTip] = useState(0);

  const totalValue = Number(total || "0");
  const peopleValue = Math.max(1, Number(people || "1"));
  const split = splitBill(totalValue, peopleValue, tip);

  return (
    <>
      <Intro>Bagi tagihan bersama jadi rata. Pembagian selalu bulat rupiah dan sisa satu-dua rupiah disebut terang-terangan.</Intro>

      <div className="module-form">
        <MoneyInput label="Total tagihan" value={total} onChange={setTotal} quick={[]} />

        <div className="field">
          <FieldLabel htmlFor="split-orang">Jumlah orang</FieldLabel>
          <TextInput id="split-orang" value={people} onChange={setPeople} inputMode="numeric" />
        </div>

        <p className="module-label">Tip / service (boleh 0)</p>
        <div className="chips">
          {[0, 5, 10, 15].map((option) => (
            <button
              key={option}
              type="button"
              className="chip"
              aria-pressed={tip === option}
              onClick={() => setTip(option)}
            >
              {tip === option ? "✓ " : ""}
              {option}%
            </button>
          ))}
        </div>
      </div>

      <Rows>
        <Row label="Total setelah tip" value={formatRupiah(String(split.totalWithTip))} />
        <Row label={`Dibagi ${split.people} orang`} value={formatRupiah(String(split.perPerson))} strong />
        <Row label="Ditambahkan ke orang pertama" value={formatRupiah(String(split.extraForFirst))} />
      </Rows>

      {totalValue > 0 && (
        <p className="support">
          {split.extraForFirst === 0
            ? `Pas: ${split.people} × ${formatRupiah(String(split.perPerson))} = ${formatRupiah(String(split.totalWithTip))}.`
            : `Tidak pas dibagi ${split.people}. Orang pertama bayar ${formatRupiah(String(split.perPerson + split.extraForFirst))}, sisanya ${formatRupiah(String(split.perPerson))}. Tidak ada rupiah yang hilang.`}
        </p>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Aset (UMKM) */

export function AsetModule({ book }: ModuleProps) {
  const [name, setName] = useState("");
  const [beli, setBeli] = useState("");
  const [nilai, setNilai] = useState("");

  const beliValue = Number(beli || "0");
  const nilaiValue = Number(nilai || "0");
  const totalBeli = sum(book.assets.map((asset) => ({ amount: asset.beli })));
  const totalNilai = sum(book.assets.map((asset) => ({ amount: asset.nilai })));

  function add() {
    if (!name.trim() || beliValue <= 0) return;
    book.setAssets((prev) => [
      ...prev,
      { id: uid(), name: name.trim(), beli: beliValue, nilai: nilaiValue || beliValue, date: today() },
    ]);
    setName("");
    setBeli("");
    setNilai("");
  }

  return (
    <>
      <Intro>
        Barang yang dipakai usaha: etalase, gerobak, kompor, alat. Nilai sekarang boleh dikosongkan — otomatis dianggap
        sama dengan harga beli.
      </Intro>

      <div className="module-form">
        <div className="field">
          <FieldLabel htmlFor="aset-nama">Nama barang</FieldLabel>
          <TextInput id="aset-nama" value={name} onChange={setName} placeholder="Contoh: etalase kaca" />
        </div>
        <MoneyInput label="Harga beli" value={beli} onChange={setBeli} quick={[]} />
        <MoneyInput label="Nilai sekarang (boleh dikosongkan)" value={nilai} onChange={setNilai} quick={[]} />

        <div className="actionbar" style={{ marginTop: 0 }}>
          <Button variant="filled" onClick={add} disabled={beliValue <= 0 || !name.trim()}>
            Tambah aset
          </Button>
        </div>
        {(beliValue <= 0 || !name.trim()) && <p className="field-hint">Isi nama barang dan harga belinya dulu.</p>}
      </div>

      <Rows>
        <Row label="Total harga beli" value={formatRupiah(String(totalBeli))} />
        <Row label="Total nilai sekarang" value={formatRupiah(String(totalNilai))} strong />
        <Row label="Selisih (susut)" value={formatRupiah(String(totalBeli - totalNilai))} />
      </Rows>

      <h3 className="h-section">Daftar aset</h3>
      {book.assets.length === 0 ? (
        <Empty>Belum ada aset tercatat.</Empty>
      ) : (
        <div className="card card-tight">
          <ul className="list">
            {book.assets.map((asset) => (
              <li key={asset.id}>
                <span className="list-main">{asset.name}</span>
                <span className="list-amount">{formatRupiah(String(asset.nilai))}</span>
                <span className="list-sub">
                  Beli {formatRupiah(String(asset.beli))} · {asset.date}
                </span>
                <button
                  type="button"
                  className="link-danger"
                  onClick={() => book.setAssets((prev) => prev.filter((item) => item.id !== asset.id))}
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Sinkronisasi */

/** Honest status, not a decorative "synced" tick: device-only mode says so, and a failed upload
    stays in the queue with its error rather than disappearing. */
export function SinkronModule({ namespace }: ModuleProps) {
  const { pending, online, busy, flushNow, configured } = useQueue(namespace);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    const outcome = await flushNow();
    setResult(
      outcome.sent === 0 && outcome.left > 0
        ? `Belum berhasil. ${outcome.left} catatan masih menunggu.`
        : `${outcome.sent} catatan terkirim, ${outcome.left} masih menunggu.`,
    );
  }

  return (
    <>
      <Intro>
        Catatan selalu disimpan dulu di perangkat ini, jadi tidak pernah hilang saat sinyal putus. Kalau server
        tersedia, catatan dikirim menyusul dan antreannya terlihat di sini.
      </Intro>

      <div className="card">
        <p className="row">
          <span className="row-label">Mode data</span>
          <span className="amount">{configured ? "Perangkat + server" : "Perangkat ini saja"}</span>
        </p>
        <p className="row">
          <span className="row-label">Koneksi</span>
          <span className="amount">{online ? "Online" : "Offline"}</span>
        </p>
        <p className="row">
          <span className="row-label">Menunggu dikirim</span>
          <span className="amount">{pending} catatan</span>
        </p>
      </div>

      {configured ? (
        <div className="actionbar">
          <Button variant="filled" onClick={send} disabled={busy || pending === 0}>
            Kirim sekarang
          </Button>
        </div>
      ) : (
        <p className="support">
          Demo ini berjalan tanpa akun, jadi semua data tinggal di perangkat ini. Saat alamat server diisi
          (<code>VITE_API_URL</code>), antrean otomatis mengirim catatan yang tertunda.
        </p>
      )}

      {result && (
        <p className="support" role="status">
          {result}
        </p>
      )}
    </>
  );
}
