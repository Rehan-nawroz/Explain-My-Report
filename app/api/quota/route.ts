import { NextResponse } from "next/server";
import { readQuota } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

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
    return NextResponse.json(
      { error: "Please sign in to continue." },
      { status: 401 },
    );
  }

  try {
    const { left, resetsAt } = await readQuota(supabase);
    return NextResponse.json(
      { left, resetsAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not read your allowance." },
      { status: 500 },
    );
  }
}
