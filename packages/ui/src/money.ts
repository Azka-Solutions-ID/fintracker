/* Money helpers. Integer rupiah only — no floats in the DB, no decimals in the UI. */

/** 125000 -> "125.000" (display grouping, what the input shows). */
export function groupDigits(digits: string): string {
  const clean = digits.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "Rp 125.000" — the canonical display for amounts. */
export function formatRupiah(digits: string): string {
  return `Rp ${groupDigits(digits) || "0"}`;
}

/** Digits from anything the user typed or pasted. */
export function parseDigits(input: string): string {
  return input.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

function below100(n: number): string {
  if (n < 12) return SATUAN[n] ?? "";
  if (n < 20) return `${below100(n - 10)} belas`;
  const puluh = Math.floor(n / 10);
  const sisa = n % 10;
  return `${SATUAN[puluh]} puluh${sisa ? ` ${below100(sisa)}` : ""}`;
}

function below1000(n: number): string {
  const ratus = Math.floor(n / 100);
  const sisa = n % 100;
  let out = ratus === 1 ? "seratus" : ratus > 1 ? `${SATUAN[ratus]} ratus` : "";
  if (sisa > 0) out += `${out ? " " : ""}${below100(sisa)}`;
  return out;
}

const GROUPS: [number, string][] = [
  [1_000_000_000_000, "triliun"],
  [1_000_000_000, "miliar"],
  [1_000_000, "juta"],
  [1_000, "ribu"],
];

/** Indonesian words for an integer. Used to echo the amount before saving. */
export function toWords(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  if (value === 0) return "nol";
  let rest = Math.floor(value);
  const parts: string[] = [];
  for (const [size, name] of GROUPS) {
    if (rest >= size) {
      const count = Math.floor(rest / size);
      rest %= size;
      parts.push(count === 1 && name === "ribu" ? "seribu" : `${below1000(count)} ${name}`);
    }
  }
  if (rest > 0) parts.push(below1000(rest));
  return parts.join(" ").trim();
}

/** "seratus dua puluh lima ribu rupiah" — the low-numeracy safety net. */
export function rupiahWords(digits: string): string {
  const n = Number(digits || "0");
  if (!digits || n === 0) return "nol rupiah";
  return `${toWords(n)} rupiah`;
}
