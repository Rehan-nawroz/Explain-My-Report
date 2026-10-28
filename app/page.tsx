import AppWorkspace from "@/components/app-workspace";
import AuthSignIn from "@/components/auth-signin";
import { readQuota } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthSignIn
        initialError={
          error === "sign_in_failed"
            ? "We couldn't complete sign-in. Please try again."
            : null
        }
      />
    );
  }

  let left = 3;
  let resetsAt: string | null = null;
  try {
    const quota = await readQuota(supabase);
    left = quota.left;
    resetsAt = quota.resetsAt;
  } catch {
    // A failed count must not block the input screen — /api/explain
    // re-checks the quota atomically before spending anything.
  }

  return (
    <AppWorkspace
      email={user.email ?? "your account"}
      initialLeft={left}
      initialResetsAt={resetsAt}
    />
  );
}
