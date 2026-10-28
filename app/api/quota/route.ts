import { NextResponse } from "next/server";
import { readQuota } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

/**
 * GET /api/quota → { left, resetsAt } for the signed-in user.
 * Personalized, so never cached. Reading goes through the RLS-scoped
 * session client: the user can only count their own rows.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ error: "Please sign in to continue." }, 401);
  }

  try {
    const { left, resetsAt } = await readQuota(supabase);
    return json({ left, resetsAt });
  } catch {
    return json({ error: "Could not read your allowance." }, 500);
  }
}
