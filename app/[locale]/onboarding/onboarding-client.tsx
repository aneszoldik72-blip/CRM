"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  completeOnboardingAction,
  skipOnboardingAction,
} from "@/app/[locale]/onboarding/actions";
import { useRouter } from "@/i18n/navigation";
import type { CurrencyCode } from "@/lib/data/countries";
import { type BaseCurrency } from "@/lib/validators/profile";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import {
  StepFirstEntry,
  type EntryStepValue,
} from "@/components/onboarding/step-first-entry";
import {
  StepFirstProduct,
  type ProductStepValue,
} from "@/components/onboarding/step-first-product";
import {
  StepProfile,
  type ProfileStepValue,
} from "@/components/onboarding/step-profile";
import { StepReveal } from "@/components/onboarding/step-reveal";
import { StepWelcome } from "@/components/onboarding/step-welcome";

type Step = "welcome" | "profile" | "product" | "entry" | "reveal";
const ORDER: Step[] = ["welcome", "profile", "product", "entry", "reveal"];

export type OnboardingClientProps = {
  initialFullName: string;
  initialCountry: string;
  initialCurrency: BaseCurrency;
};

const EMPTY_ENTRY: EntryStepValue = {
  leads: 0,
  orders: 0,
  delivered: 0,
  revenue_cents: 0,
  ads_spend_cents: 0,
  test_spend_cents: 0,
  ad_account_cents: 0,
  product_cost_cents: 0,
  service_cost_cents: 0,
  bonus_cents: 0,
  // Required by entrySchema (nullable but the key has to exist).
  initial_stock: null,
  current_stock: null,
  // Placeholders — overwritten with product.currency on final submit.
  sales_currency: "USD",
  costs_currency: "USD",
};

// Persist mid-flow progress so a refresh resumes where the user was. We
// version the key so a future shape change can invalidate stale blobs
// without crashing the page.
const STORAGE_KEY = "voidcraft.onboarding.v1";

type PersistedState = {
  step: Step;
  profile: ProfileStepValue;
  product: ProductStepValue;
  entry: EntryStepValue;
};

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.step ||
      !parsed.profile ||
      !parsed.product ||
      !parsed.entry
    ) {
      return null;
    }
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

function clearPersisted() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function OnboardingClient({
  initialFullName,
  initialCountry,
  initialCurrency,
}: OnboardingClientProps) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("welcome");

  const [profile, setProfile] = useState<ProfileStepValue>({
    full_name: initialFullName,
    country: initialCountry,
    default_currency: initialCurrency,
  });

  const [product, setProduct] = useState<ProductStepValue>({
    name: "",
    country: initialCountry,
    currency: initialCurrency as CurrencyCode,
  });

  const [entry, setEntry] = useState<EntryStepValue>(EMPTY_ENTRY);

  // Hydrate from localStorage on mount so a refresh keeps the user where
  // they were. Server-side initial values still win if there's no stored
  // session.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const persisted = loadPersisted();
    if (persisted) {
      setStep(persisted.step);
      setProfile(persisted.profile);
      setProduct(persisted.product);
      setEntry(persisted.entry);
    }
  }, []);

  // Write-through to localStorage on every state change after hydration.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      const blob: PersistedState = { step, profile, product, entry };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
    } catch {
      // localStorage might be full or disabled — silently degrade.
    }
  }, [step, profile, product, entry]);

  // When the user lands on the product step for the first time, sync the
  // product defaults to whatever they picked in the profile step.
  function advanceFromProfile() {
    setProduct((p) => ({
      ...p,
      country: p.country || profile.country,
      currency:
        (p.currency as string) === ""
          ? (profile.default_currency as unknown as CurrencyCode)
          : p.currency,
    }));
    goto("product");
  }

  function goto(next: Step) {
    setStep(next);
  }

  function prev() {
    const i = ORDER.indexOf(step);
    if (i > 0) setStep(ORDER[i - 1]!);
  }

  function handleSkip() {
    startTransition(async () => {
      const res = await skipOnboardingAction();
      if (res.ok) {
        clearPersisted();
        router.replace("/dashboard");
      } else {
        toast.error(res.serverError ?? t("errorToast"));
      }
    });
  }

  function handleFinalSubmit() {
    startTransition(async () => {
      const res = await completeOnboardingAction({
        profile,
        product,
        // Onboarding has no per-section currency selector; both sales and
        // costs default to the product currency the user picked.
        entry: {
          ...entry,
          sales_currency: product.currency,
          costs_currency: product.currency,
        },
      });
      if (res.ok) {
        clearPersisted();
        router.replace("/dashboard?welcome=1");
      } else {
        toast.error(res.serverError ?? t("errorToast"));
      }
    });
  }

  const stepNumber = ORDER.indexOf(step) + 1;

  return (
    <OnboardingCard step={stepNumber} total={ORDER.length}>
      {step === "welcome" && <StepWelcome onNext={() => goto("profile")} />}

      {step === "profile" && (
        <StepProfile
          value={profile}
          onChange={setProfile}
          onNext={advanceFromProfile}
          onSkip={handleSkip}
        />
      )}

      {step === "product" && (
        <StepFirstProduct
          value={product}
          onChange={setProduct}
          onNext={() => goto("entry")}
          onBack={prev}
          onSkip={handleSkip}
        />
      )}

      {step === "entry" && (
        <StepFirstEntry
          value={entry}
          currency={product.currency}
          onChange={setEntry}
          onNext={() => goto("reveal")}
          onBack={prev}
          onSkip={handleSkip}
        />
      )}

      {step === "reveal" && (
        <StepReveal
          entry={entry}
          currency={product.currency}
          submitting={pending}
          onSubmit={handleFinalSubmit}
          onBack={prev}
        />
      )}
    </OnboardingCard>
  );
}
