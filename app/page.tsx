import AppWorkspace from "@/components/app-workspace";
import AuthSignIn from "@/components/auth-signin";
import { readQuota } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthSignIn />;
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
