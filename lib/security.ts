/**
 * Security headers that depend on the environment.
 *
 * The CSP is applied by the proxy (not next.config) because config-level CSP
 * did not surface on responses in this Next version. It is skipped only for
 * local development, where HMR and the dev overlay need eval and websockets.
 * Vercel is always treated as production, so a deployed response can never
 * silently lose the policy even if NODE_ENV is misreported.
 */

export function contentSecurityPolicy({ secure }: { secure: boolean }): string {
  let supabaseOrigin = "https://*.supabase.co";
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
    }
  } catch {
    // Keep the wildcard fallback if the URL is malformed at build time.
  }

  const directives = [
    "default-src 'self'",
    // Next.js bootstraps pages with inline scripts; the app ships no
    // third-party scripts, so inline + same-origin is the practical floor.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  // Only meaningful over TLS; on an HTTP LAN-IP check it would upgrade
  // same-origin assets to https and break the page.
  if (secure) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}
