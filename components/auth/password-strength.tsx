"use client";

export type Criterion = { key: string; label: string; test: (v: string) => boolean };

export const passwordCriteria: Criterion[] = [
  { key: "len", label: "Au moins 8 caractères", test: (v) => v.length >= 8 },
  { key: "up", label: "Une majuscule", test: (v) => /[A-Z]/.test(v) },
  { key: "num", label: "Un chiffre", test: (v) => /\d/.test(v) },
  { key: "sym", label: "Un symbole", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function PasswordStrength({ value }: { value: string }) {
  const passed = passwordCriteria.filter((c) => c.test(value)).length;

  return (
    <div className="grid gap-3" aria-hidden>
      <div className="flex gap-1">
        {passwordCriteria.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full bg-white/[0.06] transition-colors duration-200"
            style={i < passed ? { backgroundColor: "#8b6bff" } : undefined}
          />
        ))}
      </div>
      <ul className="grid gap-1.5 text-[12.5px] text-muted-foreground">
        {passwordCriteria.map((c) => {
          const ok = c.test(value);
          return (
            <li
              key={c.key}
              className="flex items-center gap-2 transition-colors"
              style={ok ? { color: "#edeae3" } : undefined}
            >
              <span
                aria-hidden
                className="inline-flex size-3 items-center justify-center rounded-full border"
                style={
                  ok
                    ? { background: "#8b6bff", borderColor: "#8b6bff" }
                    : { borderColor: "rgba(255,255,255,0.18)" }
                }
              >
                {ok && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M1.5 4.2L3.2 5.9L6.5 2.5"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
