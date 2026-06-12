import { BrandMark } from "@/components/auth/brand-mark";
import { LanguageSwitcher } from "@/components/auth/language-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* Soft top-left light source */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 start-[-10rem] h-[520px] w-[520px] rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(circle at center, #8b6bff 0%, transparent 60%)",
        }}
      />

      <main className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-6 py-10">
        {/* Card: visible chrome on md+; dissolves on mobile */}
        <div className="w-full max-w-[420px] md:rounded-[14px] md:border md:border-border/80 md:bg-card md:px-8 md:py-10 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="mb-7">
            <BrandMark />
          </div>
          {children}
        </div>

        <div className="mt-8 md:mt-6">
          <LanguageSwitcher />
        </div>
      </main>
    </div>
  );
}
