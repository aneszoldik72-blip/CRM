import { createClient } from "@/lib/supabase/server";
import { signOut } from "../../(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center gap-6 px-6">
      <p className="text-[28px] font-medium tracking-tight">
        Hello {user?.email}
      </p>
      <form action={signOut}>
        <Button
          type="submit"
          variant="outline"
          className="h-10 px-4"
        >
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}
