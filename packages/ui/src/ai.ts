/** Client for the AI endpoints. The model key lives on the server; this file only knows the
    demo API URL and a shared token that slows casual abuse of a public demo. When VITE_AI_URL is
    not set the app stays on the deterministic answers it can compute on the device — every AI
    feature therefore has a path that works with no model at all. */

const base = (import.meta.env?.VITE_AI_URL as string | undefined)?.replace(/\/+$/, "");
const token = import.meta.env?.VITE_AI_TOKEN as string | undefined;

export function aiConfigured(): boolean {
  return Boolean(base);
}

export type AskReply = { answer: string; model: string };
export type ReceiptReply = {
  merchant: string | null;
  total: number | null;
  date: string | null;
  items: { name: string; amount: number }[];
  model: string;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!base) throw new Error("AI belum diaktifkan di build ini.");
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { "x-ai-token": token } : {}) },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
  return payload;
}

export function askAi(question: string, context: Record<string, unknown>): Promise<AskReply> {
  return post<AskReply>("/v1/ai/ask", { question, context });
}

export function readReceiptAi(input: { text?: string; image?: string }): Promise<ReceiptReply> {
  return post<ReceiptReply>("/v1/ai/receipt", input);
}

/** Phone photos are 3–8 MB; the model only needs readable text, and the demo has a body limit. */
export async function fileToDataUrl(file: File, maxSide = 1200): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Perangkat ini tidak bisa mengolah foto.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}
