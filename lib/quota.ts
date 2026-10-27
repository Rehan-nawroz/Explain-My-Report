import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/env";

/**
 * Rolling 24-hour quota: at most DAILY_LIMIT explanations per user.
 *
 * Reservation happens in ONE database statement (the `try_reserve` RPC,
 * security-invoker so RLS still applies) before any LLM call, serialized
 * per user with an advisory lock so two concurrent requests cannot both
 * take the last slot. Report contents never touch this module — only
 * user id and text/image kind.
 */

export const DAILY_LIMIT = 3;
export const QUOTA_WINDOW_MS = 86_400_000; // 24h rolling window

export type QuotaResult =
  | { ok: true; usageId: string }
  | { ok: false; resetsAt: string };

/**
 * Minimal storage surface so tests run against a fake. The real
 * implementation wraps a Supabase client (`createQuotaDB`).
 */
export interface QuotaDB {
  /** Single atomic statement: reserve a slot or report the oldest in-window row. */
  tryReserve(input: {
    userId: string;
    kind: "text" | "image";
  }): Promise<{ usageId: string | null; oldest: string | null }>;
  /** Delete exactly one usage row (refund path — service role only). */
  deleteUsage(usageId: string): Promise<void>;
}

/**
 * Reserve one slot for `userId`. Exactly one `tryReserve` call — never a
 * check-then-insert from the client. Returns `resetsAt` as the instant the
 * oldest in-window row ages out (fallback: now + 24h).
 */
export async function reserveQuota(
  db: QuotaDB,
  userId: string,
  kind: "text" | "image",
): Promise<QuotaResult> {
  const { usageId, oldest } = await db.tryReserve({ userId, kind });
  if (usageId !== null) {
    return { ok: true, usageId };
  }

  const parsed = oldest ? Date.parse(oldest) : Number.NaN;
  const base = Number.isFinite(parsed) ? parsed : Date.now();
  return { ok: false, resetsAt: new Date(base + QUOTA_WINDOW_MS).toISOString() };
}

/**
 * Refund a reserved slot after an LLM/schema failure. Uses the service-role
 * key (no client session here); throws on failure after logging only the
 * usage id — callers treat a failed refund as non-fatal.
 */
export async function refundQuota(
  usageId: string,
  db?: QuotaDB,
): Promise<void> {
  try {
    const target = db ?? createServiceQuotaDB();
    await target.deleteUsage(usageId);
  } catch (err) {
    console.error(
      "[quota] refund failed for usage",
      usageId,
      err instanceof Error ? err.message : String(err),
    );
    throw err;
  }
}

/** Real QuotaDB backed by any Supabase client (session client for reserve). */
export function createQuotaDB(client: SupabaseClient): QuotaDB {
  return {
    async tryReserve({ kind }) {
      const { data, error } = await client.rpc("try_reserve", {
        p_kind: kind,
      });
      if (error) {
        throw new Error(`quota reserve failed: ${error.message}`);
      }
      const row = (data ?? {}) as { usage_id?: string | null; oldest?: string | null };
      return { usageId: row.usage_id ?? null, oldest: row.oldest ?? null };
    },
    async deleteUsage(usageId) {
      const { error } = await client
        .from("report_usage")
        .delete()
        .eq("id", usageId);
      if (error) {
        throw new Error(`quota refund failed: ${error.message}`);
      }
    },
  };
}

/** Service-role QuotaDB for the refund path (no cookies, no session). */
export function createServiceQuotaDB(): QuotaDB {
  const { url, secretKey } = requireSupabaseEnv();
  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return createQuotaDB(admin);
}
