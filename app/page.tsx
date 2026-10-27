import AuthSignIn from "@/components/auth-signin";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthSignIn />;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Explain My Report</h1>
      <p className="mt-4 text-neutral-600">
        Signed in as {user.email ?? "unknown"} — the report input flow arrives
        in Tasks 9–11.
      </p>
    </main>
  );
}
