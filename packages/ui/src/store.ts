import { useCallback, useEffect, useMemo, useState } from "react";

/** Phase 2 data layer. Everything lives on the device (localStorage) because the demo has no
    login by design — docs/FEATURES.md §7 still has "public or private data?" open, and the
    client's own example app stores everything in one shared spreadsheet with no auth, which we
    explicitly rejected. When the account layer lands, these collections map 1:1 to tables. */

export type Kind = "masuk" | "keluar";

export type Entry = {
  id: string;
  kind: Kind;
  walletId: string;
  amount: number;
  note?: string;
  categoryId?: string;
  date: string; // YYYY-MM-DD, local time
};

export type Category = { id: string; name: string; kind: Kind };
export type Budget = { id: string; categoryId: string; limit: number };
export type Debt = { id: string; type: "utang" | "piutang"; name: string; amount: number; due?: string; settled: boolean };
export type Goal = { id: string; name: string; target: number; saved: number };
export type Asset = { id: string; name: string; beli: number; nilai: number; date: string };
export type Cycle = { period: "mingguan" | "bulanan"; anchorDay: number };
export type Profile = { nama: string; wa: string };

export type Book = {
  entries: Entry[];
  categories: Category[];
  budgets: Budget[];
  debts: Debt[];
  goals: Goal[];
  assets: Asset[];
  cycle: Cycle;
  profile: Profile;
  setEntries: (next: Entry[] | ((prev: Entry[]) => Entry[])) => void;
  setCategories: (next: Category[] | ((prev: Category[]) => Category[])) => void;
  setBudgets: (next: Budget[] | ((prev: Budget[]) => Budget[])) => void;
  setDebts: (next: Debt[] | ((prev: Debt[]) => Debt[])) => void;
  setGoals: (next: Goal[] | ((prev: Goal[]) => Goal[])) => void;
  setAssets: (next: Asset[] | ((prev: Asset[]) => Asset[])) => void;
  setCycle: (next: Cycle) => void;
  setProfile: (next: Profile) => void;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "jual", name: "Penjualan", kind: "masuk" },
  { id: "jasa", name: "Jasa / ongkir", kind: "masuk" },
  { id: "bahan", name: "Bahan baku", kind: "keluar" },
  { id: "operasional", name: "Operasional", kind: "keluar" },
  { id: "rumah", name: "Kebutuhan rumah", kind: "keluar" },
];

export function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2)}`;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota or private mode: the device keeps whatever is in memory
  }
}

/** One namespace per app, so the two demos never share data on the same device. */
export function useBook(namespace: string, defaults: { categories: Category[]; cycle: Cycle }): Book {
  const key = (name: string) => `${namespace}.${name}`;

  const [entries, setEntriesState] = useState<Entry[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>(defaults.categories);
  const [budgets, setBudgetsState] = useState<Budget[]>([]);
  const [debts, setDebtsState] = useState<Debt[]>([]);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [assets, setAssetsState] = useState<Asset[]>([]);
  const [cycle, setCycleState] = useState<Cycle>(defaults.cycle);
  const [profile, setProfileState] = useState<Profile>({ nama: "", wa: "" });

  // hydrate once, migrating entries written before dates existed
  useEffect(() => {
    const storedEntries = read<Entry[]>(key("entries"), []).map((entry) => ({
      ...entry,
      date: entry.date ?? today(),
    }));
    setEntriesState(storedEntries);
    setCategoriesState(read<Category[]>(key("categories"), defaults.categories));
    setBudgetsState(read<Budget[]>(key("budgets"), []));
    setDebtsState(read<Debt[]>(key("debts"), []));
    setGoalsState(read<Goal[]>(key("goals"), []));
    setAssetsState(read<Asset[]>(key("assets"), []));
    setCycleState(read<Cycle>(key("cycle"), defaults.cycle));
    setProfileState(read<Profile>(key("profile"), { nama: "", wa: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  useEffect(() => save(key("entries"), entries), [entries, namespace]);
  useEffect(() => save(key("categories"), categories), [categories, namespace]);
  useEffect(() => save(key("budgets"), budgets), [budgets, namespace]);
  useEffect(() => save(key("debts"), debts), [debts, namespace]);
  useEffect(() => save(key("goals"), goals), [goals, namespace]);
  useEffect(() => save(key("assets"), assets), [assets, namespace]);
  useEffect(() => save(key("cycle"), cycle), [cycle, namespace]);
  useEffect(() => save(key("profile"), profile), [profile, namespace]);

  const setEntries = useCallback((next: Entry[] | ((prev: Entry[]) => Entry[])) => {
    setEntriesState((prev) => (typeof next === "function" ? (next as (p: Entry[]) => Entry[])(prev) : next));
  }, []);
  const setCategories = useCallback((next: Category[] | ((prev: Category[]) => Category[])) => {
    setCategoriesState((prev) => (typeof next === "function" ? (next as (p: Category[]) => Category[])(prev) : next));
  }, []);
  const setBudgets = useCallback((next: Budget[] | ((prev: Budget[]) => Budget[])) => {
    setBudgetsState((prev) => (typeof next === "function" ? (next as (p: Budget[]) => Budget[])(prev) : next));
  }, []);
  const setDebts = useCallback((next: Debt[] | ((prev: Debt[]) => Debt[])) => {
    setDebtsState((prev) => (typeof next === "function" ? (next as (p: Debt[]) => Debt[])(prev) : next));
  }, []);
  const setGoals = useCallback((next: Goal[] | ((prev: Goal[]) => Goal[])) => {
    setGoalsState((prev) => (typeof next === "function" ? (next as (p: Goal[]) => Goal[])(prev) : next));
  }, []);
  const setAssets = useCallback((next: Asset[] | ((prev: Asset[]) => Asset[])) => {
    setAssetsState((prev) => (typeof next === "function" ? (next as (p: Asset[]) => Asset[])(prev) : next));
  }, []);

  return {
    entries,
    categories,
    budgets,
    debts,
    goals,
    assets,
    cycle,
    profile,
    setEntries,
    setCategories,
    setBudgets,
    setDebts,
    setGoals,
    setAssets,
    setCycle: setCycleState,
    setProfile: setProfileState,
  };
}

/* ---------------------------------------------------------------- derived numbers */

export function sum(list: { amount: number }[]): number {
  return list.reduce((total, item) => total + item.amount, 0);
}

export function totals(entries: Entry[]) {
  const masuk = sum(entries.filter((e) => e.kind === "masuk"));
  const keluar = sum(entries.filter((e) => e.kind === "keluar"));
  return { masuk, keluar, selisih: masuk - keluar };
}

export function balancePerWallet(entries: Entry[], walletIds: string[]) {
  return walletIds.map((id) => {
    const owned = entries.filter((e) => e.walletId === id);
    const t = totals(owned);
    return { id, masuk: t.masuk, keluar: t.keluar, saldo: t.selisih };
  });
}

/** Monday-first week containing `anchor`, as seven YYYY-MM-DD strings. */
export function weekDays(anchor = new Date()): string[] {
  const day = (anchor.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(anchor);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - day);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
  });
}

export const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function weeklySeries(entries: Entry[]) {
  const days = weekDays();
  return days.map((date, index) => {
    const ofDay = entries.filter((e) => e.date === date);
    const t = totals(ofDay);
    return { date, label: DAY_NAMES[index], ...t };
  });
}

export function spentByCategory(entries: Entry[], categoryId: string): number {
  return sum(entries.filter((e) => e.categoryId === categoryId && e.kind === "keluar"));
}

export function monthSpent(entries: Entry[]): number {
  const needle = today().slice(0, 7);
  return sum(entries.filter((e) => e.kind === "keluar" && e.date.startsWith(needle)));
}

/* ---------------------------------------------------------------- health score */

export type HealthPart = { label: string; verdict: string; points: number; max: number; detail: string };

export type Health = { score: number; label: string; parts: HealthPart[] };

/** Deliberately simple and explainable: three rules a participant can repeat out loud after the
    class. No black box — every point has a sentence attached, and the numbers are shown. */
export function healthOf(entries: Entry[], debts: Debt[], saldo: number): Health {
  const t = totals(entries);
  const parts: HealthPart[] = [];

  // 1. spending ratio
  let ratioPoints = 0;
  let ratioVerdict = "Belum ada data";
  let ratioDetail = "Catat pemasukan dulu supaya rasio bisa dihitung.";
  if (t.masuk > 0) {
    const ratio = t.keluar / t.masuk;
    const percent = Math.round(ratio * 100);
    ratioDetail = `Belanja ${percent}% dari pemasukan (${percent} dari 100).`;
    if (ratio <= 0.7) {
      ratioPoints = 40;
      ratioVerdict = "Aman";
    } else if (ratio <= 0.9) {
      ratioPoints = 24;
      ratioVerdict = "Waspada";
    } else {
      ratioPoints = 8;
      ratioVerdict = "Bahaya";
    }
  }
  parts.push({ label: "Belanja vs pemasukan", verdict: ratioVerdict, points: ratioPoints, max: 40, detail: ratioDetail });

  // 2. debt load
  const openDebt = debts.filter((d) => !d.settled && d.type === "utang");
  const debtTotal = sum(openDebt);
  let debtPoints = 40;
  let debtVerdict = "Aman";
  let debtDetail = "Tidak ada utang tercatat.";
  if (debtTotal > 0) {
    const base = t.masuk > 0 ? t.masuk : 1;
    const ratio = debtTotal / base;
    debtDetail = `Utang Rp ${debtTotal.toLocaleString("id-ID")} = ${Math.round(ratio * 100)}% dari pemasukan.`;
    if (ratio <= 0.3) {
      debtPoints = 30;
      debtVerdict = "Masih aman";
    } else if (ratio <= 0.6) {
      debtPoints = 18;
      debtVerdict = "Berat";
    } else {
      debtPoints = 6;
      debtVerdict = "Terlalu berat";
    }
  }
  parts.push({ label: "Utang", verdict: debtVerdict, points: debtPoints, max: 40, detail: debtDetail });

  // 3. cash left
  let cashPoints = 0;
  let cashVerdict = "Kosong";
  let cashDetail = "Saldo dompet masih nol atau minus.";
  if (saldo > 0) {
    cashPoints = 20;
    cashVerdict = "Ada sisa";
    cashDetail = `Sisa di dompet Rp ${saldo.toLocaleString("id-ID")}.`;
  }
  parts.push({ label: "Sisa uang", verdict: cashVerdict, points: cashPoints, max: 20, detail: cashDetail });

  const score = parts.reduce((total, part) => total + part.points, 0);
  const label = score >= 80 ? "Sehat" : score >= 55 ? "Cukup" : score >= 30 ? "Perlu dibenahi" : "Belum terkendali";
  return { score, label, parts };
}

/* ---------------------------------------------------------------- badges */

export type Badge = { id: string; name: string; note: string; earned: boolean; rule: string };

export function badgesOf(book: Pick<Book, "entries" | "budgets" | "debts" | "goals">): Badge[] {
  const { entries, budgets, debts, goals } = book;
  const days = new Set(entries.map((e) => e.date));
  const keptBudget = budgets.some((budget) => {
    const used = sum(entries.filter((e) => e.categoryId === budget.categoryId && e.kind === "keluar"));
    return used > 0 && used <= budget.limit;
  });
  return [
    { id: "first", name: "Catatan pertama", note: "Satu transaksi tercatat", rule: "1 transaksi", earned: entries.length >= 1 },
    { id: "five", name: "Lima transaksi", note: "Syarat rubrik modul 3", rule: "5 transaksi", earned: entries.length >= 5 },
    { id: "ten", name: "Rajin mencatat", note: "Sepuluh transaksi", rule: "10 transaksi", earned: entries.length >= 10 },
    { id: "three-days", name: "Tiga hari berturut", note: "Mencatat di tiga hari berbeda", rule: "3 hari", earned: days.size >= 3 },
    { id: "budget", name: "Belanja terkendali", note: "Ada kategori yang tetap di bawah anggaran", rule: "anggaran dijaga", earned: keptBudget },
    { id: "debt-free", name: "Bebas utang", note: "Semua utang sudah dilunasi", rule: "utang 0", earned: debts.length > 0 && debts.every((d) => d.settled) },
    { id: "goal", name: "Tujuan tercapai", note: "Satu tujuan sudah terkumpul penuh", rule: "target tercapai", earned: goals.some((g) => g.target > 0 && g.saved >= g.target) },
  ];
}

/* ---------------------------------------------------------------- cycle helpers */

export function cycleInfo(cycle: Cycle, entries: Entry[]) {
  const now = new Date();
  const t = totals(entries);

  if (cycle.period === "mingguan") {
    const days = weekDays(now);
    const todayIndex = (now.getDay() + 6) % 7;
    const left = 7 - todayIndex;
    const spentThisWeek = sum(entries.filter((e) => e.kind === "keluar" && days.includes(e.date)));
    return {
      title: "Mingguan",
      position: `Hari ke-${todayIndex + 1} dari 7`,
      left,
      spent: spentThisWeek,
      dailyBudget: Math.max(0, Math.floor((t.masuk - spentThisWeek) / Math.max(1, left))),
    };
  }

  const day = now.getDate();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const left = Math.max(1, lastDay - day + 1);
  const monthKey = today().slice(0, 7);
  const spentThisMonth = sum(entries.filter((e) => e.kind === "keluar" && e.date.startsWith(monthKey)));
  return {
    title: `Bulanan (tanggal ${cycle.anchorDay})`,
    position: `Hari ke-${day} dari ${lastDay}`,
    left,
    spent: spentThisMonth,
    dailyBudget: Math.max(0, Math.floor((t.masuk - spentThisMonth) / left)),
  };
}

/** Everything a module screen needs, memoised once per render pass. */
export function useDerived(book: Book, walletIds: string[]) {
  return useMemo(
    () => ({
      totals: totals(book.entries),
      wallets: balancePerWallet(book.entries, walletIds),
      week: weeklySeries(book.entries),
      health: healthOf(book.entries, book.debts, balancePerWallet(book.entries, walletIds).reduce((t, w) => t + w.saldo, 0)),
      badges: badgesOf(book),
      cycle: cycleInfo(book.cycle, book.entries),
    }),
    [book, walletIds],
  );
}
