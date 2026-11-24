/* Fails the build if a palette change breaks contrast.
   WCAG 1.4.3 needs 4.5:1 for text, 1.4.11 needs 3:1 for controls/borders.
   Our own floor is 7:1 for body text on every surface, because the audience is 45+. */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(import.meta.dir, "tokens.css"), "utf8");
const token = (name: string): string => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m?.[1]) throw new Error(`token --${name} not found in tokens.css`);
  return m[1];
};

const channel = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex: string): number => {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};

export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const pairs: [string, string, number, string][] = [
  ["on-surface", "surface", 7, "body text on page"],
  ["on-surface", "surface-container", 7, "body text on cards"],
  ["on-surface", "surface-container-highest", 7, "body text on filled fields"],
  ["on-surface-variant", "surface", 7, "secondary text on page"],
  ["on-surface-variant", "surface-container", 7, "secondary text on cards"],
  ["on-primary", "primary", 4.5, "label on filled button"],
  ["on-primary-container", "primary-container", 4.5, "selected pocket card"],
  ["on-secondary-container", "secondary-container", 4.5, "selected segment / nav indicator"],
  ["on-error", "error", 4.5, "label on error button"],
  ["on-error-container", "error-container", 4.5, "error message block"],
  ["on-inverse-surface", "inverse-surface", 4.5, "snackbar text"],
  ["outline", "surface", 3, "input and card borders (1.4.11)"],
];

let failed = 0;
for (const [fg, bg, min, label] of pairs) {
  const ratio = contrast(token(fg), token(bg));
  const ok = ratio >= min;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(34)} ${ratio.toFixed(2)}:1  (min ${min})`);
}

if (failed > 0) {
  console.error(`\n${failed} contrast pair(s) below the floor. Fix the palette, not the test.`);
  process.exit(1);
}
console.log("\nAll contrast pairs pass.");
