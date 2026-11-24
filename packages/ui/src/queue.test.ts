import { beforeEach, describe, expect, test } from "bun:test";

/* A tiny localStorage stand-in: the queue must work on a device, so the test proves the
   persistence path rather than mocking it away entirely. */
const store = new Map<string, string>();
const fakeStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
};
// @ts-expect-error — test shim for the browser API
globalThis.localStorage = fakeStorage;

const { enqueue, flush, postTransaction } = await import("./queue");

const NS = "test.queue";
const body = { app: "umkm", amount: 5000 };

beforeEach(() => store.clear());

describe("offline write queue", () => {
  test("keeps a write when the request fails, with the error attached", async () => {
    // @ts-expect-error — failing fetch
    globalThis.fetch = async () => ({ ok: false, status: 503 });

    const result = await postTransaction(NS, body, "https://contoh.test");
    expect(result.sent).toBe(false);

    const stored = JSON.parse(store.get(`${NS}.queue`) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].body.amount).toBe(5000);
    expect(stored[0].lastError).toContain("503");
  });

  test("does not queue when no server is configured at all", async () => {
    const result = await postTransaction(NS, body, undefined);
    expect(result.sent).toBe(false);
    expect(store.get(`${NS}.queue`)).toBeUndefined();
  });

  test("drains the queue when the server comes back", async () => {
    enqueue(NS, body);
    enqueue(NS, { ...body, amount: 7000 });

    // @ts-expect-error — successful fetch
    globalThis.fetch = async () => ({ ok: true, status: 201 });

    const result = await flush(NS, "https://contoh.test");
    expect(result.sent).toBe(2);
    expect(result.left).toBe(0);
    expect(JSON.parse(store.get(`${NS}.queue`) ?? "[]")).toHaveLength(0);
  });

  test("keeps the rest queued and counts the attempt when a retry fails", async () => {
    enqueue(NS, body);

    // @ts-expect-error — failing fetch
    globalThis.fetch = async () => ({ ok: false, status: 500 });

    const result = await flush(NS, "https://contoh.test");
    expect(result.sent).toBe(0);
    expect(result.left).toBe(1);

    const stored = JSON.parse(store.get(`${NS}.queue`) ?? "[]");
    expect(stored[0].tries).toBe(1);
    expect(stored[0].lastError).toContain("500");
  });
});
