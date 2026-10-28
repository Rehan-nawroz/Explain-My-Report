import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link landing route: exchanges the auth `code` for a
 * session cookie, then redirects to a validated same-origin path.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Same-origin redirect only — never an external URL (open-redirect guard).
  // Reject protocol-relative paths, backslash variants (URL parsers normalize
  // "\" to "/", so "/\\xyz.com" would otherwise become "//xyz.com"),
  // control characters, and anything that is not a plain absolute path.
  const safeNext =
    /^\/(?![/\\])[\x20-\x7e]*$/.test(next) ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=sign_in_failed`);
}
