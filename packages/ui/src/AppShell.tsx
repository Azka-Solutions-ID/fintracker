import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppBar } from "./AppBar";
import { Button } from "./Button";
import { IconChart, IconGrid, IconPlus } from "./Icons";
import { MoneyInput } from "./MoneyInput";
import { NavBar, type NavTab } from "./NavBar";
import { SettingsPanel } from "./SettingsPanel";
import { WalletPicker } from "./WalletPicker";
import { formatRupiah, rupiahWords } from "./money";
import { sum, today, uid, useBook, type Category, type Entry, type Kind } from "./store";
import type { ModuleProps, Vocab } from "./modules/parts";
import { postTransaction } from "./queue";

export type Wallet = { id: string; name: string; hint: string };

export type ModuleGroup = "atur" | "lihat" | "alat";

/** Every module is a top-level destination. It carries its own icon and group so the desktop
    sidebar and the phone hub are generated from one list instead of maintained twice. */
export type ModuleDef = {
  id: string;
  name: string;
  note: string;
  group: ModuleGroup;
  icon: ReactNode;
  render: (props: ModuleProps) => ReactNode;
};

export type Phase3Item = { name: string; note: string };

export type AppShellProps = {
  /** localStorage namespace: the two demos never share data on the same device */
  namespace: string;
  title: string;
  heading: string;
  wallets: Wallet[];
  defaultWallet: string;
  vocab: Vocab;
  categories: Category[];
  modules: ModuleDef[];
  /** module ids promoted to the phone bottom bar — 5 destinations total, the M3 maximum */
  primary: string[];
  phase3: Phase3Item[];
  brand?: string;
  helpContact?: string;
};

const GROUPS: { id: ModuleGroup; title: string }[] = [
  { id: "atur", title: "Atur uang" },
  { id: "lihat", title: "Lihat kondisi" },
  { id: "alat", title: "Alat & data" },
];

const TARGET = 5;

/** Phone: bottom bar plus a hub. Desktop: a permanent sidebar with every destination on one
    level. Same routes in both, so nothing sits "one level deeper" just because the screen is wider. */
function useIsWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 900px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}

export function BookkeepingApp({
  namespace,
  title,
  heading,
  wallets,
  defaultWallet,
  vocab,
  categories,
  modules,
  primary,
  phase3,
  brand = "S",
  helpContact = "6281234567890",
}: AppShellProps) {
  const book = useBook(namespace, { categories, cycle: { period: "bulanan", anchorDay: 1 } });
  const wide = useIsWide();

  const [route, setRoute] = useState<string>("catat");
  const [kind, setKind] = useState<Kind>("masuk");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [wallet, setWallet] = useState<string | null>(defaultWallet);
  const [done, setDone] = useState<Entry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(null), 8000);
    return () => clearTimeout(timer);
  }, [done]);

  const value = Number(amount || "0");
  const activeModule = modules.find((item) => item.id === route) ?? null;
  const inPrimary = primary.includes(route);

  const totals = useMemo(() => {
    const masuk = sum(book.entries.filter((entry) => entry.kind === "masuk"));
    const keluar = sum(book.entries.filter((entry) => entry.kind === "keluar"));
    const perWallet = wallets.map((item) => {
      const owned = book.entries.filter((entry) => entry.walletId === item.id);
      return {
        ...item,
        saldo:
          sum(owned.filter((entry) => entry.kind === "masuk")) - sum(owned.filter((entry) => entry.kind === "keluar")),
      };
    });
    const perCategory = categories
      .map((category) => ({
        ...category,
        total: sum(book.entries.filter((entry) => entry.categoryId === category.id)),
      }))
      .filter((category) => category.total > 0);
    return { masuk, keluar, selisih: masuk - keluar, perWallet, perCategory };
  }, [book.entries, wallets, categories]);

  const validCategories = book.categories.filter((category) => category.kind === kind);
  const chosenCategory = validCategories.some((category) => category.id === categoryId) ? categoryId : "";

  function submit() {
    if (value <= 0) {
      setError("Isi jumlah uangnya dulu ya.");
      document.querySelector<HTMLInputElement>(".money-input")?.focus();
      return;
    }
    if (!wallet) {
      setError("Pilih dompetnya dulu ya.");
      return;
    }
    setError(null);
    const entry: Entry = {
      id: uid(),
      kind,
      walletId: wallet,
      amount: value,
      note: note.trim() || undefined,
      categoryId: chosenCategory || undefined,
      date: today(),
    };
    book.setEntries((prev) => [entry, ...prev]);
    setDone(entry);
    setAmount("");
    setNote("");
    void postTransaction(namespace, payloadOf(entry, namespace));
  }

  function undo() {
    if (!done) return;
    book.setEntries((prev) => prev.filter((entry) => entry.id !== done.id));
    setDone(null);
  }

  const primaryModules = primary
    .map((id) => modules.find((item) => item.id === id))
    .filter((item): item is ModuleDef => Boolean(item));

  const phoneTabs: NavTab[] = [
    { id: "catat", label: "Catat", icon: <IconPlus /> },
    { id: "laporan", label: "Laporan", icon: <IconChart /> },
    ...primaryModules.map((item) => ({
      id: item.id,
      label: item.name.split(" ")[0] ?? item.name,
      icon: item.icon,
    })),
    { id: "fitur", label: "Fitur", icon: <IconGrid /> },
  ];

  function go(next: string) {
    setRoute(next);
    window.scrollTo({ top: 0 });
  }

  const showBack = !wide && Boolean(activeModule) && !inPrimary;

  return (
    <div className="app-root">
      <aside className="sidebar" aria-label="Navigasi utama">
        <div className="sidebar-brand">
          <span className="appbar-mark" aria-hidden="true">
            {brand}
          </span>
          <span className="sidebar-title">{title}</span>
        </div>

        <nav className="sidebar-nav" aria-label="Semua tujuan">
          <button
            type="button"
            className={route === "catat" ? "side-item is-active" : "side-item"}
            aria-current={route === "catat" ? "page" : undefined}
            onClick={() => go("catat")}
          >
            <IconPlus />
            <span>Catat</span>
          </button>
          <button
            type="button"
            className={route === "laporan" ? "side-item is-active" : "side-item"}
            aria-current={route === "laporan" ? "page" : undefined}
            onClick={() => go("laporan")}
          >
            <IconChart />
            <span>Laporan</span>
          </button>

          {GROUPS.map((group) => {
            const items = modules.filter((item) => item.group === group.id);
            if (items.length === 0) return null;
            return (
              <div className="side-group" key={group.id}>
                <p className="side-group-title">{group.title}</p>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={route === item.id ? "side-item is-active" : "side-item"}
                    aria-current={route === item.id ? "page" : undefined}
                    onClick={() => go(item.id)}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <a
          className="side-help"
          href={`https://wa.me/${helpContact}?text=${encodeURIComponent("Saya butuh bantuan memakai aplikasi catatan keuangan.")}`}
        >
          Butuh bantuan? Chat pendamping
        </a>
      </aside>

      <div className="app-main">
        <AppBar
          title={
            activeModule ? activeModule.name : route === "laporan" ? "Laporan" : route === "fitur" ? "Fitur" : title
          }
          brand={brand}
          helpContact={helpContact}
          onBack={showBack ? () => go("fitur") : undefined}
        />

        <main className="screen">
          {activeModule ? (
            <section aria-label={activeModule.name}>
              {activeModule.render({ book, walletIds: wallets.map((item) => item.id), v: vocab, namespace })}
            </section>
          ) : route === "catat" ? (
            <section aria-labelledby="catat-judul">
              <div className="layout-2col">
                <div>
                  <h2 id="catat-judul" className="h-page">
                    {heading}
                  </h2>

                  <div className="segmented" role="group" aria-label="Jenis transaksi">
                    <button
                      type="button"
                      className="segment"
                      aria-pressed={kind === "masuk"}
                      onClick={() => setKind("masuk")}
                    >
                      <span className="segment-check" aria-hidden="true">
                        {kind === "masuk" ? "✓" : ""}
                      </span>
                      <span className="segment-label">{vocab.masuk}</span>
                    </button>
                    <button
                      type="button"
                      className="segment"
                      aria-pressed={kind === "keluar"}
                      onClick={() => setKind("keluar")}
                    >
                      <span className="segment-check" aria-hidden="true">
                        {kind === "keluar" ? "✓" : ""}
                      </span>
                      <span className="segment-label">{vocab.keluar}</span>
                    </button>
                  </div>

                  <MoneyInput value={amount} onChange={setAmount} />

                  <div className="field">
                    <div className="text-field">
                      <label htmlFor="keterangan">Keterangan</label>
                      <input
                        id="keterangan"
                        type="text"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        aria-describedby="keterangan-hint"
                      />
                    </div>
                    <p id="keterangan-hint" className="field-hint">
                      Boleh dikosongkan. Contoh: {kind === "masuk" ? "jual keripik tempe" : "beli minyak"}.
                    </p>
                  </div>

                  <div className="field">
                    <label className="module-label" htmlFor="catat-kategori">
                      Kategori (boleh dikosongkan)
                    </label>
                    <select
                      id="catat-kategori"
                      className="module-select"
                      value={chosenCategory}
                      onChange={(event) => setCategoryId(event.target.value)}
                    >
                      <option value="">Tanpa kategori</option>
                      {validCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <WalletPicker
                    legend="Masuk atau keluar dari dompet mana?"
                    name="wallet"
                    wallets={wallets}
                    value={wallet}
                    onChange={setWallet}
                  />

                  {error && (
                    <p className="error-text" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="actionbar">
                    <Button variant="filled" onClick={submit}>
                      Simpan
                    </Button>
                  </div>
                </div>

                <aside className="side-rail" aria-label="Ringkasan hari ini">
                  <div className="card">
                    <p className="support" style={{ marginBottom: "var(--gap)" }}>
                      Ringkasan hari ini
                    </p>
                    <p className="row">
                      <span className="row-label">{vocab.masuk}</span>
                      <span className="amount">{formatRupiah(String(totals.masuk))}</span>
                    </p>
                    <p className="row">
                      <span className="row-label">{vocab.keluar}</span>
                      <span className="amount">{formatRupiah(String(totals.keluar))}</span>
                    </p>
                    <p className="row">
                      <span className="row-label">{totals.selisih >= 0 ? vocab.laba : vocab.minus}</span>
                      <span className="amount-hero">{formatRupiah(String(Math.abs(totals.selisih)))}</span>
                    </p>
                  </div>
                  <div className="card" style={{ marginTop: "var(--gap)" }}>
                    <p className="progress-line">
                      <span>
                        {book.entries.length >= TARGET
                          ? `${book.entries.length} transaksi tercatat`
                          : `${book.entries.length} dari ${TARGET} transaksi`}
                      </span>
                      <span className="progress-track" aria-hidden="true">
                        <span
                          className="progress-fill"
                          style={{ width: `${Math.min(book.entries.length / TARGET, 1) * 100}%` }}
                        />
                      </span>
                    </p>
                  </div>
                </aside>
              </div>
            </section>
          ) : route === "laporan" ? (
            <section aria-labelledby="laporan-judul">
              <h2 id="laporan-judul" className="h-page">
                Laporan hari ini
              </h2>

              <div className="progress-line">
                <span aria-live="polite">
                  {book.entries.length >= TARGET
                    ? `✓ ${book.entries.length} transaksi tercatat`
                    : `${book.entries.length} dari ${TARGET} transaksi`}
                </span>
                <span className="progress-track" aria-hidden="true">
                  <span
                    className="progress-fill"
                    style={{ width: `${Math.min(book.entries.length / TARGET, 1) * 100}%` }}
                  />
                </span>
              </div>

              <div className="layout-2col">
                <div>
                  <div className="card">
                    {book.profile.nama && (
                      <p className="support" style={{ marginBottom: "var(--gap)" }}>
                        {book.profile.nama}
                      </p>
                    )}
                    <p className="row">
                      <span className="row-label">{vocab.masuk}</span>
                      <span className="amount">{formatRupiah(String(totals.masuk))}</span>
                    </p>
                    <p className="row">
                      <span className="row-label">{vocab.keluar}</span>
                      <span className="amount">{formatRupiah(String(totals.keluar))}</span>
                    </p>
                    <p className="row">
                      <span className="row-label">{totals.selisih >= 0 ? vocab.laba : vocab.minus}</span>
                      <span className="amount-hero">{formatRupiah(String(Math.abs(totals.selisih)))}</span>
                    </p>
                  </div>

                  <h3 className="h-section">Sisa per dompet</h3>
                  <div className="card">
                    {totals.perWallet.map((item) => (
                      <p className="row" key={item.id}>
                        <span className="row-label">{item.name}</span>
                        <span className="amount">
                          {item.saldo < 0 ? `− ${formatRupiah(String(-item.saldo))}` : formatRupiah(String(item.saldo))}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>

                <aside className="side-rail" aria-label="Rincian per kategori">
                  {totals.perCategory.length > 0 && (
                    <>
                      <h3 className="h-section">Per kategori</h3>
                      <div className="card">
                        {totals.perCategory.map((category) => (
                          <p className="row" key={category.id}>
                            <span className="row-label">{category.name}</span>
                            <span className="amount">{formatRupiah(String(category.total))}</span>
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </aside>
              </div>

              <h3 className="h-section">Daftar transaksi</h3>
              {book.entries.length === 0 ? (
                <p className="support">Belum ada transaksi. Mulai dari mencatat yang pertama.</p>
              ) : (
                <div className="card card-tight">
                  <ul className="list">
                    {book.entries.map((entry) => (
                      <li key={entry.id}>
                        <span className="list-main">{formatRupiah(String(entry.amount))}</span>
                        <span className="list-amount">{entry.kind === "masuk" ? "Masuk" : "Keluar"}</span>
                        <span className="list-sub">
                          {wallets.find((item) => item.id === entry.walletId)?.name ?? entry.walletId}
                          {entry.note ? ` · ${entry.note}` : ""}
                          {entry.date !== today() ? ` · ${entry.date}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : (
            <section aria-labelledby="fitur-judul">
              <h2 id="fitur-judul" className="h-page">
                Fitur
              </h2>
              <p className="support">Semua yang ada di daftar ini sudah bisa dipakai sekarang.</p>

              {GROUPS.map((group) => {
                const items = modules.filter((item) => item.group === group.id && !primary.includes(item.id));
                if (items.length === 0) return null;
                return (
                  <div key={group.id}>
                    <h3 className="h-section">{group.title}</h3>
                    <div className="module-grid">
                      {items.map((item) => (
                        <button key={item.id} type="button" className="module-card" onClick={() => go(item.id)}>
                          <span className="module-card-icon" aria-hidden="true">
                            {item.icon}
                          </span>
                          <span className="module-card-name">{item.name}</span>
                          <span className="module-card-note">{item.note}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <h3 className="h-section">Belum dikerjakan</h3>
              <p className="support">Ditandai jujur supaya tidak ada tombol yang tidak berfungsi.</p>
              <div className="card card-tight">
                <ul className="list modules">
                  {phase3.map((item) => (
                    <li key={item.name}>
                      <span className="list-main">{item.name}</span>
                      <span className="pill">Fase 3</span>
                      <span className="list-sub">{item.note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <h3 className="h-section">Profil</h3>
              <div className="card">
                <div className="field">
                  <div className="text-field">
                    <label htmlFor="nama">Nama usaha</label>
                    <input
                      id="nama"
                      type="text"
                      value={book.profile.nama}
                      onChange={(event) => book.setProfile({ ...book.profile, nama: event.target.value })}
                    />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="text-field">
                    <label htmlFor="wa">Nomor WA</label>
                    <input
                      id="wa"
                      type="tel"
                      inputMode="tel"
                      value={book.profile.wa}
                      onChange={(event) => book.setProfile({ ...book.profile, wa: event.target.value })}
                      aria-describedby="wa-hint"
                    />
                  </div>
                  <p id="wa-hint" className="field-hint">
                    Dipakai pendamping kalau perlu menghubungi.
                  </p>
                </div>
              </div>

              <SettingsPanel />
            </section>
          )}
        </main>
      </div>

      <NavBar tabs={phoneTabs} current={route} onChange={go} />

      {done && route === "catat" && (
        <div className="snackbar" role="status">
          <span className="snackbar-text">Tersimpan: {rupiahWords(String(done.amount))}.</span>
          <Button variant="text" onClick={undo}>
            Urungkan
          </Button>
        </div>
      )}
    </div>
  );
}

/** The write payload, kept in one place so the retry queue sends exactly what the first attempt did. */
function payloadOf(entry: Entry, namespace: string): Record<string, unknown> {
  return {
    app: namespace.includes("pekerja") ? "pekerja" : "umkm",
    wallet_id: entry.walletId,
    kind: entry.kind,
    amount: entry.amount,
    note: entry.note,
    category_id: entry.categoryId,
    occurred_on: entry.date,
  };
}
