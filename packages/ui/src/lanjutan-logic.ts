import { formatRupiah } from "./money";

/* ============================================================ fase 3, tanpa AI

   Two of the fase 3 features (scan struk, AI chat) must keep working without any model — the
   brief says so explicitly. These pure functions are that fallback: a receipt parser and a
   question answerer that run on the device, with no network and no key. */

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, feb: 2, februari: 2, mar: 3, maret: 3, apr: 4, april: 4,
  mei: 5, may: 5, jun: 6, juni: 6, jul: 7, juli: 7, agu: 8, agt: 8, agustus: 8, aug: 8,
  sep: 9, september: 9, okt: 10, oktober: 10, oct: 10, nov: 11, november: 11, des: 12, desember: 12, dec: 12,
};

function toIso(year: number, month: number, day: number): string | undefined {
  const fullYear = year < 100 ? 2000 + year : year;
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return `${fullYear}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
}

/** Indonesian receipts write 125.000 and 1.250.000,00. Return the integer rupiah value. */
export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return 0;
  // a trailing ",00" or ",-" is cents, not thousands
  const withoutCents = cleaned.replace(/[.,]\d{2}$/, "");
  const digits = withoutCents.replace(/[.,]/g, "");
  return Number(digits || "0");
}

const TOTAL_WORDS = /(total|jumlah|bayar|tagihan|grand\s*total|subtotal)/i;

export type Receipt = {
  amount?: number;
  date?: string;
  merchant?: string;
  /** every rupiah-looking number found, biggest first — the user can pick another */
  candidates: number[];
};

/** Reads a receipt typed or pasted as text: the honest alternative to OCR. */
export function parseReceipt(text: string): Receipt {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates: number[] = [];
  let totalFromKeyword: number | undefined;

  for (const line of lines) {
    // a date line holds a year, not a price: "22/11/2026" must not become a 2.026 chip
    if (/^\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s*$/.test(line)) continue;
    if (/^\s*\d{4}-\d{2}-\d{2}\s*$/.test(line)) continue;
    if (/\d{1,2}\s+[a-zA-Z]{3,9}\s+\d{4}/.test(line) && !/\d{3}/.test(line.replace(/\d{4}/, ""))) continue;

    const numbers = line.match(/\d[\d.,]{2,}/g) ?? [];
    for (const raw of numbers) {
      const value = parseAmount(raw);
      if (value >= 100) {
        candidates.push(value);
        if (TOTAL_WORDS.test(line)) totalFromKeyword = value;
      }
    }
  }

  const unique = [...new Set(candidates)].sort((a, b) => b - a);

  // date: 22/11/2026, 22-11-2026, or 22 Nov 2026
  let date: string | undefined;
  const joined = lines.join(" ");
  const numeric = joined.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (numeric) date = toIso(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]));
  if (!date) {
    const named = joined.toLowerCase().match(/\b(\d{1,2})\s+([a-z]+)\s+(\d{2,4})\b/);
    const month = named?.[2] ? MONTHS[named[2]] : undefined;
    if (named && month) date = toIso(Number(named[3]), month, Number(named[1]));
  }

  // merchant: first line with letters and no currency amount
  const merchant = lines.find((line) => /[a-z]/i.test(line) && !/\d{3}/.test(line) && line.length >= 3 && line.length <= 40);

  return {
    amount: totalFromKeyword ?? unique[0],
    date,
    merchant,
    candidates: unique.slice(0, 6),
  };
}

/* ---------------------------------------------------------------- tanya jawab */

export type Answer = { text: string; matched: string };

export type AskContext = {
  masuk: number;
  keluar: number;
  selisih: number;
  entries: { amount: number; kind: string; categoryId?: string }[];
  wallets: { name: string; saldo: number }[];
  categories: { id: string; name: string }[];
  budgets: { categoryId: string; limit: number }[];
  debts: { type: string; amount: number; settled: boolean }[];
  goals: { name: string; target: number; saved: number }[];
};

const rupiah = (value: number) => formatRupiah(String(Math.round(value)));

/** Keyword answers over the user's own numbers. Deterministic, offline, explainable. */
export function answerQuestion(question: string, ctx: AskContext): Answer {
  const q = question.toLowerCase();

  if (/(keluar|belanja|pengeluaran|habis)/.test(q)) {
    const perCategory = ctx.categories
      .map((category) => ({
        name: category.name,
        total: ctx.entries
          .filter((entry) => entry.kind === "keluar" && entry.categoryId === category.id)
          .reduce((total, entry) => total + entry.amount, 0),
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
    const biggest = perCategory[0];
    return {
      matched: "keluar",
      text: biggest
        ? `Total keluar ${rupiah(ctx.keluar)}. Paling besar: ${biggest.name} ${rupiah(biggest.total)}.`
        : `Belum ada pengeluaran yang tercatat.`,
    };
  }

  if (/(masuk|pendapatan|penghasilan|omzet|jual)/.test(q)) {
    return { matched: "masuk", text: `Total masuk ${rupiah(ctx.masuk)} dari ${ctx.entries.length} catatan.` };
  }

  if (/(dompet|saldo|kas|pegang)/.test(q)) {
    const list = ctx.wallets.map((wallet) => `${wallet.name} ${rupiah(wallet.saldo)}`).join(", ");
    return { matched: "dompet", text: `Sisa per dompet: ${list}.` };
  }

  if (/(anggaran|budget|batas)/.test(q)) {
    if (ctx.budgets.length === 0) {
      return { matched: "anggaran", text: "Belum ada anggaran. Bisa dibuat di menu Anggaran belanja." };
    }
    const lines = ctx.budgets.map((budget) => {
      const name = ctx.categories.find((category) => category.id === budget.categoryId)?.name ?? "kategori";
      const used = ctx.entries
        .filter((entry) => entry.kind === "keluar" && entry.categoryId === budget.categoryId)
        .reduce((total, entry) => total + entry.amount, 0);
      const left = budget.limit - used;
      return `${name}: terpakai ${rupiah(used)} dari ${rupiah(budget.limit)} (${left >= 0 ? `sisa ${rupiah(left)}` : `lewat ${rupiah(-left)}`})`;
    });
    return { matched: "anggaran", text: lines.join("; ") + "." };
  }

  if (/(utang|hutang|piutang|bon)/.test(q)) {
    const open = ctx.debts.filter((debt) => !debt.settled);
    const utang = open.filter((debt) => debt.type === "utang").reduce((total, debt) => total + debt.amount, 0);
    const piutang = open.filter((debt) => debt.type === "piutang").reduce((total, debt) => total + debt.amount, 0);
    return {
      matched: "utang",
      text: `Utang belum lunas ${rupiah(utang)}, piutang belum tertagih ${rupiah(piutang)}.`,
    };
  }

  if (/(tujuan|target|nabung|tabungan)/.test(q)) {
    if (ctx.goals.length === 0) return { matched: "tujuan", text: "Belum ada tujuan menabung yang dicatat." };
    const goal = ctx.goals[0];
    if (!goal) return { matched: "tujuan", text: "Belum ada tujuan menabung yang dicatat." };
    const percent = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
    return {
      matched: "tujuan",
      text: `${goal.name}: ${rupiah(goal.saved)} dari ${rupiah(goal.target)} (${percent}%).`,
    };
  }

  // "sisa" alone means profit; "sisa anggaran" / "sisa dompet" belong to the specific answers
  // above, which is why this rule sits after them.
  if (/(untung|laba|selisih|bersih)/.test(q) || (/sisa/.test(q) && !/(anggaran|budget|dompet|saldo|utang|hutang)/.test(q))) {
    return {
      matched: "laba",
      text: `Selisih hari ini ${rupiah(ctx.selisih)} — masuk ${rupiah(ctx.masuk)} dikurangi keluar ${rupiah(ctx.keluar)}.`,
    };
  }

  if (/(berapa|jumlah).*(transaksi|catatan)/.test(q) || /(transaksi|catatan)/.test(q)) {
    return { matched: "transaksi", text: `Ada ${ctx.entries.length} transaksi tercatat di perangkat ini.` };
  }

  return {
    matched: "belum",
    text:
      "Aku hanya menghitung dari catatan di perangkat ini, jadi belum bisa menjawab itu. " +
      "Coba tanya soal untung hari ini, total keluar, sisa dompet, anggaran, utang, atau tujuan menabung.",
  };
}

/* ---------------------------------------------------------------- split bill */

export type Split = {
  total: number;
  people: number;
  perPerson: number;
  extraForFirst: number;
  totalWithTip: number;
};

/** Splits a bill to whole rupiah and says out loud where the remainder went. */
export function splitBill(total: number, people: number, tipPercent = 0): Split {
  const safePeople = Math.max(1, Math.floor(people));
  const totalWithTip = Math.round(total * (1 + Math.max(0, tipPercent) / 100));
  const perPerson = Math.floor(totalWithTip / safePeople);
  const extraForFirst = totalWithTip - perPerson * safePeople;
  return { total, people: safePeople, perPerson, extraForFirst, totalWithTip };
}
