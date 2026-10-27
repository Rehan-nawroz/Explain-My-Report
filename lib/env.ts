/**
 * Server-only environment access. Every secret this app uses is read
 * through here so a missing variable fails fast with a named error
 * instead of surfacing as a vague downstream failure.
 *
 * Never import this module from client components.
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigError(
      `Missing required environment variable: ${name}. Set it in .env (local) or the Vercel dashboard (deployed).`
    );
  }
  return value;
}

/** Gemini credentials for the LLM provider (Task 5). */
export function requireGeminiEnv(): { apiKey: string; model: string } {
  return {
    apiKey: requireEnv("GEMINI_API_KEY"),
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  };
}

/** Supabase credentials for auth + quota (Tasks 6–8). */
export function requireSupabaseEnv(): {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
} {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
