import { setRequestLocale } from "next-intl/server";

import { AgentDifferentiator } from "@/components/marketing/agent-differentiator";
import { CtaBand } from "@/components/marketing/cta-band";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { Pricing } from "@/components/marketing/pricing";
import { Problem } from "@/components/marketing/problem";
import { SocialProof } from "@/components/marketing/social-proof";
import { Solution } from "@/components/marketing/solution";

export const dynamic = "force-static";
export const revalidate = false;

export default async function MarketingHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <SocialProof />
      <Problem />
      <Solution />
      <AgentDifferentiator />
      <Pricing />
      <Faq />
      <CtaBand />
    </>
  );
}
