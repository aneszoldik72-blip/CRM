import { z } from "zod";

// Phone and photo_url accept empty strings (form default) and are normalized
// to null at the DB layer. Keeping the schema input and output types aligned
// avoids react-hook-form's resolver type variance issues.
export const agentInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "agent.name.required" })
    .max(80, { message: "agent.name.tooLong" }),
  phone: z
    .string()
    .max(40, { message: "agent.phone.tooLong" })
    .nullable(),
  photo_url: z
    .string()
    .max(2048)
    .nullable()
    .refine(
      (v) => v === null || v === "" || /^https?:\/\//.test(v),
      { message: "agent.photoUrl.invalid" },
    ),
});

export const agentIdSchema = z
  .string()
  .uuid({ message: "agent.id.invalid" });

export type AgentInput = z.infer<typeof agentInputSchema>;
