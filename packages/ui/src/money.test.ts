import { describe, expect, test } from "bun:test";
import { formatRupiah, groupDigits, parseDigits, rupiahWords, toWords } from "./money";

describe("grouping and parsing", () => {
  test("groups thousands", () => {
    expect(groupDigits("125000")).toBe("125.000");
    expect(groupDigits("1000000")).toBe("1.000.000");
    expect(groupDigits("999")).toBe("999");
  });

  test("strips junk and leading zeros so a wrong zero is visible early", () => {
    expect(parseDigits("Rp 125.000")).toBe("125000");
    expect(parseDigits("000125000")).toBe("125000");
    expect(parseDigits("12a5-000")).toBe("125000");
  });

  test("formats as rupiah, never as a bare number", () => {
    expect(formatRupiah("125000")).toBe("Rp 125.000");
    expect(formatRupiah("")).toBe("Rp 0");
  });
});

describe("amount in words (the wrong-zero guard)", () => {
  test("handles the special Indonesian forms", () => {
    expect(toWords(11)).toBe("sebelas");
    expect(toWords(15)).toBe("lima belas");
    expect(toWords(100)).toBe("seratus");
    expect(toWords(1000)).toBe("seribu");
    expect(toWords(2000)).toBe("dua ribu");
  });

  test("handles the amounts this audience actually types", () => {
    expect(rupiahWords("125000")).toBe("seratus dua puluh lima ribu rupiah");
    expect(rupiahWords("200000")).toBe("dua ratus ribu rupiah");
    expect(rupiahWords("1000000")).toBe("satu juta rupiah");
    expect(rupiahWords("1500")).toBe("seribu lima ratus rupiah");
  });

  test("zero and empty are spoken, not blank", () => {
    expect(rupiahWords("0")).toBe("nol rupiah");
    expect(rupiahWords("")).toBe("nol rupiah");
  });
});
