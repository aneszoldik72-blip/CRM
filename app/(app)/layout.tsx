import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { Sidebar } from "@/components/app-shell/sidebar";
import { TopBar } from "@/components/app-shell/top-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userProps = {
    email: user.email ?? null,
    name:
      (user.user_metadata?.full_name as string | undefined)?.trim() || null,
  };

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={userProps} />
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
