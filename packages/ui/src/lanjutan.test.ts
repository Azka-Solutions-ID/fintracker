import { describe, expect, test } from "bun:test";
import { answerQuestion, parseAmount, parseReceipt, splitBill, type AskContext } from "./lanjutan-logic";

const ctx: AskContext = {
  masuk: 250_000,
  keluar: 130_000,
  selisih: 120_000,
  entries: [
    { amount: 250_000, kind: "masuk", categoryId: "jual" },
    { amount: 90_000, kind: "keluar", categoryId: "bahan" },
    { amount: 40_000, kind: "keluar", categoryId: "operasional" },
  ],
  wallets: [
    { name: "Kas Usaha", saldo: 120_000 },
    { name: "Dompet Dapur", saldo: 0 },
  ],
  categories: [
    { id: "jual", name: "Penjualan" },
    { id: "bahan", name: "Bahan baku" },
    { id: "operasional", name: "Operasional" },
  ],
  budgets: [{ categoryId: "bahan", limit: 200_000 }],
  debts: [{ type: "utang", amount: 150_000, settled: false }],
  goals: [{ name: "Etalase", target: 500_000, saved: 50_000 }],
};

describe("receipt parsing (the no-AI path)", () => {
  test("picks the total line over bigger item numbers", () => {
    const receipt = parseReceipt("Toko Sumber Rejeki\n22/11/2026\nBeras 5kg 85.000\nMinyak 2L 40.000\nTOTAL 125.000\nTunai 150.000");
    expect(receipt.amount).toBe(125_000);
    expect(receipt.date).toBe("2026-11-22");
    expect(receipt.merchant).toContain("Toko");
  });

  test("does not offer the year as an amount", () => {
    const receipt = parseReceipt(["Toko Sumber Rejeki", "22/11/2026", "TOTAL 125.000"].join("\n"));
    expect(receipt.candidates).not.toContain(2026);
    expect(receipt.candidates[0]).toBe(125_000);
  });

  test("falls back to the largest number when no total keyword exists", () => {
    const receipt = parseReceipt("Warung Bu Tini\nayam 25.000\nnasi 5.000");
    expect(receipt.amount).toBe(25_000);
  });

  test("reads Indonesian thousand separators", () => {
    expect(parseAmount("1.250.000")).toBe(1_250_000);
    expect(parseAmount("125.000,00")).toBe(125_000);
    expect(parseAmount("Rp 7.500")).toBe(7_500);
  });

  test("understands a written month", () => {
    const receipt = parseReceipt("Bengkel Jaya\n22 November 2026\nJasa servis Rp 75.000");
    expect(receipt.date).toBe("2026-11-22");
    expect(receipt.amount).toBe(75_000);
  });
});

describe("tanya jawab without a model", () => {
  test("answers profit from the real numbers", () => {
    const answer = answerQuestion("berapa untung hari ini?", ctx);
    expect(answer.matched).toBe("laba");
    expect(answer.text).toContain("120.000");
  });

  test("names the biggest spending category", () => {
    const answer = answerQuestion("pengeluaran terbesar apa?", ctx);
    expect(answer.matched).toBe("keluar");
    expect(answer.text).toContain("Bahan baku");
    expect(answer.text).toContain("130.000");
  });

  test("reports budget position", () => {
    const answer = answerQuestion("sisa anggaran berapa?", ctx);
    expect(answer.text).toContain("200.000");
    expect(answer.text).toContain("110.000");
  });

  test("admits when it cannot answer", () => {
    const answer = answerQuestion("siapa presiden pertama indonesia?", ctx);
    expect(answer.matched).toBe("belum");
    expect(answer.text.toLowerCase()).toContain("belum bisa");
  });
});

describe("split bill", () => {
  test("splits evenly when it divides", () => {
    const split = splitBill(300_000, 3);
    expect(split.perPerson).toBe(100_000);
    expect(split.extraForFirst).toBe(0);
  });

  test("keeps every rupiah when it does not divide", () => {
    const split = splitBill(100_000, 3);
    expect(split.perPerson).toBe(33_333);
    expect(split.extraForFirst).toBe(1);
    expect(split.perPerson * 3 + split.extraForFirst).toBe(100_000);
  });

  test("applies a tip before splitting", () => {
    const split = splitBill(200_000, 4, 10);
    expect(split.totalWithTip).toBe(220_000);
    expect(split.perPerson).toBe(55_000);
  });

  test("never divides by zero people", () => {
    expect(splitBill(50_000, 0).people).toBe(1);
  });
});
