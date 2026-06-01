import { z } from "zod";

// Error messages are stable keys (e.g. "auth.email.invalid"). UI resolves them
// to French/English strings via next-intl later.

const email = z
  .string()
  .min(1, { message: "auth.email.required" })
  .email({ message: "auth.email.invalid" });

const password = z
  .string()
  .min(8, { message: "auth.password.tooShort" });

export const signUpSchema = z.object({
  email,
  password,
  fullName: z.string().trim().max(120, { message: "auth.fullName.tooLong" }),
  locale: z.enum(["fr", "en", "ar"]),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { message: "auth.password.required" }),
  rememberMe: z.boolean(),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const requestResetSchema = z.object({ email });
export type RequestResetInput = z.infer<typeof requestResetSchema>;

export const updatePasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, { message: "auth.password.required" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "auth.password.mismatch",
  });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
