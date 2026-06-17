import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { getProfile } from "@/lib/db/profile";
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
  if (!user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
  }

  // Onboarding gate. Until the user has flipped onboarding_complete, every
  // /app/* route bounces to /onboarding. Skip path (handled in actions) sets
  // the flag and lands them on the dashboard.
  //
  // NB: optional chaining is important — a missing profile (trigger didn't
  // fire, RLS edge case) reads as "not complete" so we send the user to
  // /onboarding rather than letting them slip past the gate.
  const profile = await getProfile();
  if (!profile?.onboarding_complete) {
    const locale = await getLocale();
    redirect({ href: "/onboarding", locale });
  }

  const userProps = {
    email: user!.email ?? null,
    name:
      (user!.user_metadata?.full_name as string | undefined)?.trim() || null,
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
