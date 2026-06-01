import Link from "next/link";
import { Mail } from "lucide-react";
import { ResendVerificationButton } from "./resend-button";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const safeEmail = email ?? "";

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
          Vérifiez votre boîte de réception.
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {safeEmail ? (
            <>
              Nous avons envoyé un lien de confirmation à{" "}
              <strong className="text-foreground">{safeEmail}</strong>. Cliquez
              dessus pour activer votre compte. Si vous ne le voyez pas, jetez
              un œil dans les spams.
            </>
          ) : (
            <>
              Nous avons envoyé un lien de confirmation à votre adresse email.
              Cliquez dessus pour activer votre compte. Si vous ne le voyez
              pas, jetez un œil dans les spams.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-3">
        <ResendVerificationButton email={safeEmail} />
        <Link
          href="/signup"
          className="text-center text-[13.5px] text-muted-foreground hover:text-foreground"
        >
          Changer d&apos;email
        </Link>
        <Link
          href="/login"
          className="text-center text-[13.5px] text-muted-foreground hover:text-foreground"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
