# Security checklist

Run before every launch and after any change to auth, RLS policies, or
security headers.

## 1. Two-account RLS isolation test

The goal: prove that user A cannot read or modify user B's data via any
Supabase client method, even when authenticated.

**Setup**

1. Create two test accounts via the signup flow:
   - `rls-test-a@voidcraft.app` / `RlsTestA!2026`
   - `rls-test-b@voidcraft.app` / `RlsTestB!2026`
2. Sign in as A. Create a product (`Test Product A`), add a month entry with
   non-zero revenue, add an agent (`Agent A`), log a confirmation.
3. Note the row IDs from the Supabase Dashboard → Table Editor for
   `products`, `months`, `entries`, `agents`, `confirmations`.

**Test**

Sign in as B. From the browser DevTools console on `/dashboard`:

```js
const sb = window.supabase; // exposed only in dev — or use a small test script
// Try to read A's product by ID
await sb.from('products').select('*').eq('id', 'A_PRODUCT_ID'); // expect data: []
// Try to update A's product
await sb.from('products').update({ name: 'pwned' }).eq('id', 'A_PRODUCT_ID'); // expect data: []
// Try to delete A's row
await sb.from('products').delete().eq('id', 'A_PRODUCT_ID'); // expect data: []
```

Repeat for `months`, `entries`, `agents`, `confirmations`. **Every result
must return zero rows AND no error.** A "permission denied" error is also
acceptable but `[]` (empty result) is what RLS produces by default.

**Storage check**

```js
// Try to read A's avatar
const { data, error } = await sb.storage
  .from('avatars')
  .download('A_USER_ID/avatar.png');
// expect error (RLS rejection)
```

**Pass criteria**

- No row from user A is ever visible to user B.
- No mutation by B touches A's rows.
- Avatar bucket reads scoped to the calling user.

**On failure** — open an incident, patch the offending RLS policy, re-run.

Document the run in a dated note (`docs/audits/YYYY-MM-DD-rls.md`) with
account emails, test commands, and screenshots of empty results.

## 2. Security headers (securityheaders.com)

After every production deploy:

1. Visit https://securityheaders.com/?q=https://voidcraft.app
2. **Target: A+.**
3. Expected headers (from `next.config.ts`):
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `Content-Security-Policy-Report-Only: …` (until flipped to enforced)

If grade is < A+: read the report, fix the missing header, redeploy. Common
issue: HSTS preload requires manual submission to
https://hstspreload.org after `max-age >= 31536000`.

## 3. CSP enforcement flip

CSP currently ships as **Content-Security-Policy-Report-Only**. Violations
go to `/api/csp-report` → Sentry as warnings.

**Flip criteria**

- 7+ days of clean reports (zero unique violations) in Sentry.
- Or all reported violations are explicitly allowlisted in `next.config.ts`.

**Flip procedure**

1. Edit `next.config.ts`, change the header key from
   `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.
2. Deploy to a preview environment first, smoke-test all flows (signup,
   login, product page with charts, Stripe checkout once it exists, export).
3. Promote to prod.
4. Watch Sentry for 24h — any new violation now blocks the resource.

## 4. Money-path test (Stripe LIVE)

> Blocked until the Stripe billing flow ships. Keep this section here so the
> first launch includes it.

1. Switch Stripe API keys to LIVE mode.
2. Use a real card (yours). Subscribe to the monthly plan.
3. Verify in Stripe Dashboard: charge succeeded, subscription active.
4. Cancel subscription from app. Verify cancellation in Stripe.
5. Issue a full refund from Stripe Dashboard. Verify the refund webhook
   updates the local subscription state.
6. Document the run in `docs/audits/YYYY-MM-DD-stripe-live.md` with the
   Stripe charge ID and refund ID.

## 5. Rate limit smoke test

After deploy, from a clean IP:

```bash
for i in {1..7}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://voidcraft.app/fr/login \
    -d 'email=test@test.com&password=wrongwrong'
done
```

Expected: `200 200 200 200 200 429 429`. If all 7 return 200, Upstash env
vars are missing in production. Set them and redeploy.

## 6. Privacy / Terms refresh

Both pages currently render with `{{COMPANY_NAME}}` and similar placeholders.
**Before public launch**, swap real values in `messages/{fr,ar,en}.json`
under `marketing.privacy.*` and `marketing.terms.*`. Bump the draft badge
version (`v0.2` → `v1.0`) and remove the "Brouillon" pill.
