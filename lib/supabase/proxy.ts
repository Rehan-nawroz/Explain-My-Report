import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh at the network boundary (Next 16's `proxy.ts`,
 * formerly `middleware.ts` — verified against current Supabase and
 * Next.js docs).
 *
 * Responsibilities (per Supabase SSR guide):
 *  - refresh the auth token via getClaims() (signature-verified; never
 *    getSession(), which trusts the cookie unvalidated),
 *  - pass the refreshed token to server components (request.cookies),
 *  - pass it back to the browser (response.cookies).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes expired tokens before verifying; this is what keeps users
  // signed in across server-rendered requests.
  await supabase.auth.getClaims();

  // IMPORTANT: return the response that carries the refreshed cookies —
  // an earlier response would sign the user out on the next request.
  return supabaseResponse;
}
