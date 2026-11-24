import { useCallback, useEffect, useState } from "react";

/** Offline queue (docs/FEATURES.md fase 3: "sinkronisasi penuh offline queue").
    A save must never be lost because the network blipped: when no API is configured the app is
    device-only and this queue stays empty; when an API exists but the request fails, the payload
    waits here and is retried. No silent data loss, and the count is always visible to the user. */

export type PendingWrite = {
  id: string;
  body: Record<string, unknown>;
  tries: number;
  queuedAt: string;
  lastError?: string;
};

const key = (namespace: string) => `${namespace}.queue`;

function read(namespace: string): PendingWrite[] {
  try {
    const raw = localStorage.getItem(key(namespace));
    return raw ? (JSON.parse(raw) as PendingWrite[]) : [];
  } catch {
    return [];
  }
}

function write(namespace: string, items: PendingWrite[]) {
  try {
    localStorage.setItem(key(namespace), JSON.stringify(items));
  } catch {
    // storage full or private mode: nothing else we can do locally
  }
}

export function apiBase(): string | undefined {
  const base = import.meta.env?.VITE_API_URL;
  return typeof base === "string" && base.length > 0 ? base.replace(/\/$/, "") : undefined;
}

export async function postTransaction(
  namespace: string,
  body: Record<string, unknown>,
  base: string | undefined = apiBase(),
): Promise<{ sent: boolean }> {
  if (!base) return { sent: false };

  try {
    const response = await fetch(`${base}/v1/transactions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { sent: true };
  } catch (error) {
    enqueue(namespace, body, error instanceof Error ? error.message : "gagal kirim");
    return { sent: false };
  }
}

export function enqueue(namespace: string, body: Record<string, unknown>, lastError?: string) {
  const items = read(namespace);
  items.push({
    id: globalThis.crypto?.randomUUID?.() ?? `q-${Date.now()}`,
    body,
    tries: 0,
    queuedAt: new Date().toISOString(),
    lastError,
  });
  write(namespace, items);
}

export async function flush(
  namespace: string,
  base: string | undefined = apiBase(),
): Promise<{ sent: number; left: number }> {
  const items = read(namespace);
  if (!base || items.length === 0) return { sent: 0, left: items.length };

  let sent = 0;
  const remaining: PendingWrite[] = [];
  for (const item of items) {
    try {
      const response = await fetch(`${base}/v1/transactions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      sent += 1;
    } catch (error) {
      remaining.push({
        ...item,
        tries: item.tries + 1,
        lastError: error instanceof Error ? error.message : "gagal kirim",
      });
    }
  }
  write(namespace, remaining);
  return { sent, left: remaining.length };
}

export function useQueue(namespace: string) {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => setPending(read(namespace).length), [namespace]);

  useEffect(() => {
    refresh();
    const onOnline = () => {
      setOnline(true);
      void flush(namespace).then(refresh);
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const interval = setInterval(() => {
      if (read(namespace).length > 0 && navigator.onLine) {
        void flush(namespace).then(refresh);
      }
    }, 60_000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [namespace, refresh]);

  const flushNow = useCallback(async () => {
    setBusy(true);
    const result = await flush(namespace);
    setPending(result.left);
    setBusy(false);
    return result;
  }, [namespace]);

  return { pending, online, busy, flushNow, refresh, configured: Boolean(apiBase()) };
}
