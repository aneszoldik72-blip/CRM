import { getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { ResendVerificationButton } from "./resend-button";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const safeEmail = email ?? "";
  const t = await getTranslations("auth.verify");

  return (
    <div className="grid gap-7">
      <div className="grid gap-4">
        <div className="relative inline-flex size-12 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background:
                "radial-gradient(circle, #8b6bff 0%, transparent 70%)",
            }}
          />
          <Mail className="relative size-7 text-foreground" />
        </div>
        <h1 className="text-[28px] font-medium leading-tight tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {safeEmail
            ? t.rich("bodyWithEmail", {
                email: safeEmail,
                strong: (chunks) => (
                  <strong className="text-foreground">{chunks}</strong>
                ),
              })
            : t("bodyNoEmail")}
        </p>
      </div>

      <div className="grid gap-3">
        <ResendVerificationButton email={safeEmail} />
        <Link
          href="/signup"
          className="text-center text-[13.5px] text-muted-foreground hover:text-foreground"
        >
          {t("changeEmail")}
        </Link>
        <Link
          href="/login"
          className="text-center text-[13.5px] text-muted-foreground hover:text-foreground"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
