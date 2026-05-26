# VOIDCRAFT — Project Conventions

## Stack
- Next.js 15 App Router, TypeScript strict mode
- Tailwind CSS + shadcn/ui (components in /components/ui)
- Supabase (Postgres + Auth + Storage), EU region
- Stripe for payments
- next-intl for i18n (fr default, ar with RTL, en)
- Recharts for charts (lazy-loaded)
- Zod for validation, react-hook-form for forms
- Resend for transactional email
- Sentry for errors, PostHog for analytics

## Folder structure
- /app — routes, layouts, server components
- /app/(marketing) — public pages (landing, pricing, blog)
- /app/(auth) — login, signup, reset
- /app/(app) — authenticated app (dashboard, settings, billing)
- /components — shared components
- /components/ui — shadcn primitives (don't edit by hand)
- /lib — utilities, supabase client, stripe client, helpers
- /lib/db — database query functions (one file per table)
- /types — shared TypeScript types
- /hooks — custom React hooks
- /messages — i18n translation JSON files
- /supabase/migrations — database migrations

## Conventions
- File names: kebab-case (product-list.tsx)
- React components: PascalCase
- Hooks: useCamelCase
- Server actions live in /app/[route]/actions.ts
- Always validate input with Zod on the server
- Never put secrets in client components
- Prefer Server Components by default; mark Client Components with "use client"
- Use shadcn components; if missing, install via `pnpm dlx shadcn@latest add [name]`
- Use Tailwind classes; no inline styles, no CSS modules
- Currency formatting: use Intl.NumberFormat with locale
- All money in DB stored as integer (cents/centimes) to avoid float issues

## Security rules (non-negotiable)
- Every DB table has Row-Level Security enabled
- Every query filters by auth.uid() at the policy level
- No raw SQL from user input; only Supabase client methods
- Stripe webhooks: always verify signature
- Server-side validation on every mutation

## Workflow with me
- Before implementing any feature, write a short plan: files to change, data flow, edge cases
- Wait for my approval on the plan before coding
- Make small, focused commits with clear messages
- After each feature, run lint and type-check
- Tell me when you're done so I can review
