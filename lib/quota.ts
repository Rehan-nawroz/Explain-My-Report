import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/env";


export const DAILY_LIMIT = 3;
export const QUOTA_WINDOW_MS = 86_400_000; // 24h rolling window

export type QuotaResult =
  | { ok: true; usageId: string }
  | { ok: false; resetsAt: string };


export interface QuotaDB {
  
  tryReserve(input: {
    userId: string;
    kind: "text" | "image";
  }): Promise<{ usageId: string | null; oldest: string | null }>;
  /** Delete exactly one usage row (refund path — service role only). */
  deleteUsage(usageId: string): Promise<void>;
}


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


export function summarizeUsage(inWindowIso: string[]): {
  used: number;
  left: number;
  resetsAt: string | null;
} {
  const used = inWindowIso.length;
  const left = Math.max(0, DAILY_LIMIT - used);
  if (used < DAILY_LIMIT) return { used, left, resetsAt: null };

  const oldest = [...inWindowIso].sort(
    (a, b) => Date.parse(a) - Date.parse(b),
  )[0];
  const parsed = oldest ? Date.parse(oldest) : Number.NaN;
  const base = Number.isFinite(parsed) ? parsed : Date.now();
  return { used, left, resetsAt: new Date(base + QUOTA_WINDOW_MS).toISOString() };
}


export async function readQuota(client: SupabaseClient): Promise<{
  used: number;
  left: number;
  resetsAt: string | null;
}> {
  const since = new Date(Date.now() - QUOTA_WINDOW_MS).toISOString();
  const { data, error } = await client
    .from("report_usage")
    .select("created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`quota read failed: ${error.message}`);
  }
  return summarizeUsage((data ?? []).map((row) => String(row.created_at)));
}


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


export function createServiceQuotaDB(): QuotaDB {
  const { url, secretKey } = requireSupabaseEnv();
  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return createQuotaDB(admin);
}
