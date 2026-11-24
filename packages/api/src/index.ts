import { cors } from "@elysiajs/cors";
import { createClient } from "@supabase/supabase-js";
import { Elysia, t } from "elysia";

/**
 * Base API for both apps. One endpoint set, two clients.
 *
 * Auth model: no login screen. The app calls supabase.auth.signInAnonymously()
 * once per device and sends that token here; every query runs as that user so
 * Row Level Security in the database keeps devices apart. The anon key alone
 * must never be able to read another device's rows.
 */
const { SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_ORIGINS } = process.env;

const origins = (ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:5174").split(",");

function clientFor(token: string | undefined) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY missing");
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { persistSession: false },
  });
}

const bearer = (headers: Record<string, string | undefined>) =>
  headers.authorization?.replace(/^Bearer\s+/i, "") || undefined;

/** integer rupiah, 1 .. 1e12 — mirrors the DB check constraint */
const amount = t.Integer({ minimum: 1, maximum: 1_000_000_000_000 });

/* ---------------------------------------------------------------- AI proxy

   The model key never reaches the browser: the clients call this API, this API calls the model.
   Two guards, because a demo URL gets shared:
   - x-ai-token — a speed bump, not a secret (it ships inside the frontend bundle)
   - a per-IP rate limit kept in memory, so one caller cannot burn the quota
   The actual protection is that the upstream key lives only here. */

const AI_BASE_URL = (process.env.AI_BASE_URL ?? "").replace(/\/+$/, "");
const AI_MODEL = process.env.AI_MODEL ?? "deepseek-v4.1-flash";
const AI_VISION_MODEL = process.env.AI_VISION_MODEL ?? "qwen3.8-flash";
const AI_TOKEN = process.env.AI_TOKEN;

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = Number(process.env.AI_RATE_LIMIT ?? 40);
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // crude bound on memory in a long-lived instance
  return recent.length > LIMIT;
}

type ChatMessage = { role: "system" | "user"; content: unknown };

async function askModel(messages: ChatMessage[], model: string, maxTokens = 700): Promise<string> {
  if (!AI_BASE_URL) throw new Error("AI belum dikonfigurasi di server");

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.AI_API_KEY ? { authorization: `Bearer ${process.env.AI_API_KEY}` } : {}),
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.2 }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`model ${response.status}: ${detail}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("model mengembalikan jawaban kosong");
  return content.trim();
}

/** Models like to wrap JSON in prose or fences; take the first object that parses. */
function firstJson<T>(text: string): T | undefined {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return undefined;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return undefined;
  }
}

/** Vercel sets x-forwarded-for; the first entry is the caller. */
function ipOf(headers: Record<string, string | undefined>): string {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0]!.trim();
  return headers["x-real-ip"] ?? "unknown";
}

function guard(
  headers: Record<string, string | undefined>,
  ip: string,
): { status: number; error: string } | undefined {
  if (!AI_BASE_URL) return { status: 503, error: "AI belum dikonfigurasi di server." };
  if (AI_TOKEN && headers["x-ai-token"] !== AI_TOKEN) return { status: 401, error: "Token demo tidak cocok." };
  if (rateLimited(ip)) return { status: 429, error: "Terlalu banyak permintaan AI. Coba lagi nanti." };
  return undefined;
}

export default new Elysia()
  .use(cors({ origin: origins, allowedHeaders: ["content-type", "authorization", "x-ai-token"] }))
  .get("/health", () => ({
    ok: true,
    service: "sidp-api",
    ai: Boolean(AI_BASE_URL),
    models: { text: AI_MODEL, vision: AI_VISION_MODEL },
  }))
  .get(
    "/v1/transactions",
    async ({ headers, query, set }) => {
      const db = clientFor(bearer(headers as Record<string, string | undefined>));
      const { data, error } = await db
        .from("transactions")
        .select("id,wallet_id,kind,amount,note,occurred_on")
        .eq("app", query.app)
        .order("occurred_on", { ascending: false })
        .limit(50);
      if (error) {
        set.status = 400;
        return { error: error.message };
      }
      return { items: data };
    },
    { query: t.Object({ app: t.Union([t.Literal("umkm"), t.Literal("pekerja")]) }) },
  )
  .post(
    "/v1/transactions",
    async ({ body, headers, set }) => {
      const db = clientFor(bearer(headers as Record<string, string | undefined>));
      const { data, error } = await db.from("transactions").insert(body).select("id").single();
      if (error) {
        set.status = 400;
        return { error: error.message };
      }
      return { id: data.id };
    },
    {
      body: t.Object({
        app: t.Union([t.Literal("umkm"), t.Literal("pekerja")]),
        wallet_id: t.String({ minLength: 1, maxLength: 40 }),
        kind: t.Union([t.Literal("masuk"), t.Literal("keluar"), t.Literal("pindah")]),
        amount,
        note: t.Optional(t.String({ maxLength: 200 })),
        occurred_on: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
      }),
    },
  )
  /* ---- tanya jawab: model menjawab HANYA dari angka yang dikirim klien ---- */
  .post(
    "/v1/ai/ask",
    async ({ body, headers, set }) => {
      const blocked = guard(headers as Record<string, string | undefined>, ipOf(headers));
      if (blocked) {
        set.status = blocked.status;
        return { error: blocked.error };
      }

      const { question, context } = body as { question: string; context: Record<string, unknown> };

      try {
        const answer = await askModel(
          [
            {
              role: "system",
              content:
                "Kamu asisten catatan keuangan untuk pemilik usaha kecil di Indonesia. Jawab HANYA dari angka di dalam KONTEKS. " +
                "Kalau pertanyaannya tidak bisa dijawab dari konteks, katakan terus terang bahwa datanya belum ada. " +
                "Gaya: bahasa Indonesia sehari-hari, maksimal 45 kata, sebut angka dalam rupiah, tanpa basa-basi dan tanpa markdown.",
            },
            { role: "user", content: `KONTEKS:\n${JSON.stringify(context)}\n\nPERTANYAAN: ${question}` },
          ],
          AI_MODEL,
          500,
        );
        return { answer, model: AI_MODEL };
      } catch (error) {
        set.status = 502;
        return { error: error instanceof Error ? error.message : "gagal memanggil model" };
      }
    },
    {
      body: t.Object({
        question: t.String({ minLength: 2, maxLength: 300 }),
        context: t.Any(),
      }),
    },
  )
  /* ---- scan struk: teks ditempel atau foto dikirim, model mengembalikan JSON ---- */
  .post(
    "/v1/ai/receipt",
    async ({ body, headers, set }) => {
      const blocked = guard(headers as Record<string, string | undefined>, ipOf(headers));
      if (blocked) {
        set.status = blocked.status;
        return { error: blocked.error };
      }

      const instruction =
        "Baca struk belanja Indonesia ini. Balas HANYA JSON tanpa penjelasan dengan bentuk: " +
        '{"merchant":string|null,"total":number|null,"date":"YYYY-MM-DD"|null,"items":[{"name":string,"amount":number}]}. ' +
        "total = angka yang benar-benar dibayar (baris TOTAL/jumlah bayar), bukan subtotal dan bukan uang tunai. " +
        "Angka rupiah tanpa titik atau koma. Kalau tidak yakin, pakai null.";

      const { text, image } = body as { text?: string; image?: string };
      const content: unknown[] = [{ type: "text", text: instruction }];
      if (image) content.push({ type: "image_url", image_url: { url: image } });
      if (text) content.push({ type: "text", text: `Teks struk:\n${text}` });

      try {
        const raw = await askModel([{ role: "user", content }], image ? AI_VISION_MODEL : AI_MODEL, 800);
        const parsed = firstJson<{
          merchant?: string | null;
          total?: number | null;
          date?: string | null;
          items?: { name: string; amount: number }[];
        }>(raw);
        if (!parsed) {
          set.status = 502;
          return { error: "model tidak mengembalikan JSON", raw: raw.slice(0, 300) };
        }
        return {
          merchant: parsed.merchant ?? null,
          total: typeof parsed.total === "number" ? Math.round(parsed.total) : null,
          date: parsed.date ?? null,
          items: Array.isArray(parsed.items) ? parsed.items.slice(0, 30) : [],
          model: image ? AI_VISION_MODEL : AI_MODEL,
        };
      } catch (error) {
        set.status = 502;
        return { error: error instanceof Error ? error.message : "gagal memanggil model" };
      }
    },
    {
      body: t.Object({
        text: t.Optional(t.String({ maxLength: 4000 })),
        image: t.Optional(t.String({ maxLength: 6_000_000 })),
      }),
    },
  );
