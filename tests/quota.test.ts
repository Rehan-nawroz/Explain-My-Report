import { describe, expect, it, vi } from "vitest";
import {
  DAILY_LIMIT,
  QUOTA_WINDOW_MS,
  refundQuota,
  reserveQuota,
  summarizeUsage,
  type QuotaDB,
} from "@/lib/quota";

/** In-memory fake standing in for Supabase — one reserve statement, one delete. */
function makeFakeDb(
  reserveOutcome: { usageId: string | null; oldest: string | null },
) {
  const tryReserve = vi.fn<QuotaDB["tryReserve"]>(async () => reserveOutcome);
  const deleteUsage = vi.fn<QuotaDB["deleteUsage"]>(async () => {});
  const db: QuotaDB = { tryReserve, deleteUsage };
  return { db, tryReserve, deleteUsage };
}

describe("reserveQuota", () => {
  it("returns usageId when under limit", async () => {
    expect(DAILY_LIMIT).toBe(3);
    expect(QUOTA_WINDOW_MS).toBe(86_400_000);

    const { db } = makeFakeDb({ usageId: "usage-abc", oldest: null });
    const result = await reserveQuota(db, "user-1", "text");

    expect(result).toEqual({ ok: true, usageId: "usage-abc" });
  });

  it("returns ok:false with resetsAt when at limit", async () => {
    const { db } = makeFakeDb({
      usageId: null,
      oldest: "2026-10-26T10:00:00.000Z",
    });
    const result = await reserveQuota(db, "user-1", "text");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      // resetsAt = oldest-in-window + 24h → the moment the oldest slot frees up
      expect(result.resetsAt).toBe("2026-10-27T10:00:00.000Z");
    }
  });

  it("issues exactly one reserve statement (no check-then-insert)", async () => {
    const { db, tryReserve, deleteUsage } = makeFakeDb({
      usageId: "usage-abc",
      oldest: null,
    });
    await reserveQuota(db, "user-1", "text");

    expect(tryReserve).toHaveBeenCalledTimes(1);
    expect(deleteUsage).not.toHaveBeenCalled();
  });

  it("kind is recorded", async () => {
    const { db, tryReserve } = makeFakeDb({
      usageId: "usage-abc",
      oldest: null,
    });
    await reserveQuota(db, "user-42", "image");

    expect(tryReserve).toHaveBeenCalledWith({
      userId: "user-42",
      kind: "image",
    });
  });

  it("resetsAt falls back to now + 24h when oldest unknown", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T08:00:00.000Z"));
    try {
      const { db } = makeFakeDb({ usageId: null, oldest: null });
      const result = await reserveQuota(db, "user-1", "text");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.resetsAt).toBe("2026-10-28T08:00:00.000Z");
      }
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("summarizeUsage", () => {
  it("counts used slots and has no resetsAt under the limit", () => {
    const summary = summarizeUsage([
      "2026-10-27T08:00:00.000Z",
      "2026-10-27T09:00:00.000Z",
    ]);
    expect(summary).toEqual({ used: 2, left: 1, resetsAt: null });
  });

  it("resets when the limit is spent, from the oldest in-window row", () => {
    const summary = summarizeUsage([
      "2026-10-27T11:00:00.000Z",
      "2026-10-27T09:00:00.000Z",
      "2026-10-27T10:00:00.000Z",
    ]);
    expect(summary.used).toBe(3);
    expect(summary.left).toBe(0);
    expect(summary.resetsAt).toBe("2026-10-28T09:00:00.000Z");
  });

  it("never reports a negative balance", () => {
    const summary = summarizeUsage([
      "2026-10-27T09:00:00.000Z",
      "2026-10-27T10:00:00.000Z",
      "2026-10-27T11:00:00.000Z",
      "2026-10-27T12:00:00.000Z",
    ]);
    expect(summary.left).toBe(0);
  });
});

describe("refundQuota", () => {
  it("refundQuota deletes by exact usageId", async () => {
    const { db, deleteUsage } = makeFakeDb({
      usageId: null,
      oldest: null,
    });
    await refundQuota("usage-123", db);

    expect(deleteUsage).toHaveBeenCalledTimes(1);
    expect(deleteUsage).toHaveBeenCalledWith("usage-123");
  });

  it("refundQuota rethrows when delete fails", async () => {
    const deleteUsage = vi.fn<QuotaDB["deleteUsage"]>(async () => {
      throw new Error("db unreachable");
    });
    const db: QuotaDB = {
      tryReserve: vi.fn(async () => ({ usageId: null, oldest: null })),
      deleteUsage,
    };

    await expect(refundQuota("usage-123", db)).rejects.toThrow(
      "db unreachable",
    );
  });
});
