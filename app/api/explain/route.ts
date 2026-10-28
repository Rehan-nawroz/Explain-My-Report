import { NextResponse } from "next/server";
import { filterGroundedFindings } from "@/lib/grounding";
import { createProvider } from "@/lib/llm/provider";
import { parseExplanation } from "@/lib/llm/schema";
import { DISCLAIMER } from "@/lib/prompts";
import { createQuotaDB, refundQuota, reserveQuota } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";
import { validateExplainRequest } from "@/lib/validation";

/**
 * POST /api/explain — the only path from a report to an explanation.
 *
 * Flow order is load-bearing (checking auth before validation means an
 * unauthenticated caller learns nothing about their payload; reserving
 * before the LLM call means two concurrent requests can't both spend the
 * last quota slot, and refunding on failure means a broken model call
 * never costs the user an explanation).
 *
 * Report contents are never stored or logged — only user id + kind rows
 * in report_usage. Responses are personalized medical text, so they are
 * explicitly non-cacheable at every status.
 */

export const runtime = "nodejs"; // Buffer-based size checks in validation
export const maxDuration = 60; // LLM request itself times out at 30s

/** Hard stop before buffering a body; Vercel also caps requests at 4.5 MB. */
const MAX_REQUEST_BYTES = 6_000_000;

const NO_STORE = { "Cache-Control": "no-store" };

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

const err = (status: number, error: string, resetsAt?: string) =>
  json(resetsAt ? { error, resetsAt } : { error }, status);

/** Refund is best-effort: a failed refund must never mask the real error. */
async function refundQuietly(usageId: string): Promise<void> {
  try {
    await refundQuota(usageId);
  } catch {
    // refundQuota already logged the failure; the request still returns 502.
  }
}

export async function POST(request: Request) {
  // 0. Refuse cross-site browser requests before doing any work. The auth
  // cookie is SameSite=Lax, so this is defense in depth if that ever changes.
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return err(403, "Cross-site requests are not allowed.");
  }

  // Reject an obviously oversized body before JSON parsing buffers it.
  const declaredBytes = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredBytes) && declaredBytes > MAX_REQUEST_BYTES) {
    return err(413, "That upload is too large. Use a report under 4 MB.");
  }

  // 1. Parse JSON — malformed body is a 400, not a crash.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err(400, "Request body must be valid JSON.");
  }

  // 2. Authentication — no client state is trusted.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return err(401, "Please sign in to continue.");
  }

  // 3. Input validation — size and shape, server-side.
  const validated = validateExplainRequest(body);
  if (!validated.ok) {
    return err(validated.status, validated.error);
  }

  // 4. Reserve a quota slot atomically before spending money on the model.
  let quota;
  try {
    quota = await reserveQuota(
      createQuotaDB(supabase),
      user.id,
      validated.payload.kind,
    );
  } catch {
    return err(
      503,
      "We couldn't check your allowance just now. Please try again.",
    );
  }
  if (!quota.ok) {
    return err(
      429,
      "You've used all 3 explanations for now. Your next one unlocks at the time shown.",
      quota.resetsAt,
    );
  }

  // 5. Call the model. Any transport/provider failure refunds the slot.
  let raw: unknown;
  try {
    raw = await createProvider().explain({ payload: validated.payload });
  } catch {
    // Provider errors carry status only — never log the payload or the key.
    await refundQuietly(quota.usageId);
    return err(502, "We couldn't explain this report just now. Please try again.");
  }

  // 6. Validate the model's JSON. Structurally wrong output is never rendered.
  const parsed = parseExplanation(raw);
  if (!parsed.ok) {
    await refundQuietly(quota.usageId);
    return err(502, "We couldn't explain this report just now. Please try again.");
  }

  // 7. For text reports, every quoted excerpt must actually occur in the
  // report; fabricated "quotes" are dropped (and an entirely ungrounded
  // response is treated as a failed explanation). Images are the limit of
  // this check — the model transcribes them, so the UI labels every quote
  // as an AI-selected excerpt rather than a guaranteed verbatim transcript.
  const grounded = filterGroundedFindings(parsed.data, validated.payload);
  if (!grounded) {
    await refundQuietly(quota.usageId);
    return err(502, "We couldn't explain this report just now. Please try again.");
  }

  // The boundary statement is ours, not the model's: always return the fixed text.
  return json({ ...grounded, disclaimer: DISCLAIMER });
}
