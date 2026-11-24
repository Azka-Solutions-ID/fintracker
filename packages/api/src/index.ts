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

export default new Elysia()
  .use(cors({ origin: origins }))
  .get("/health", () => ({ ok: true, service: "sidp-api" }))
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
  );
