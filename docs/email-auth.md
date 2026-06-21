# Email authentication (SPF / DKIM / DMARC)

Set these DNS records at your domain registrar so transactional email from
Resend (welcome, payment-failed, trial-ending) actually lands in the inbox
and doesn't get spoofed.

> All examples assume the sending domain is `voidcraft.app`. Replace with
> your actual domain.

## 1. Verify the domain in Resend

1. Resend Dashboard → **Domains** → **Add Domain** → enter `voidcraft.app`.
2. Resend gives you 3 DNS records — typically two CNAMEs (for DKIM rotation)
   and one TXT (for SPF). Copy them.
3. Wait for Resend to mark the domain as **Verified** (usually 5-30 min).
4. Set `RESEND_FROM_EMAIL=hello@voidcraft.app` in your environment.

## 2. SPF — say who is allowed to send

Single TXT record at the apex. If you already have an SPF record, **merge**
the `include:` — never publish two SPF records, that breaks validation.

| Type | Host | Value                                       | TTL |
| ---- | ---- | ------------------------------------------- | --- |
| TXT  | @    | `v=spf1 include:_spf.resend.com ~all`       | 300 |

## 3. DKIM — cryptographic signature

Resend gives you the exact records. Typical shape:

| Type  | Host                            | Value (provided by Resend)             | TTL |
| ----- | ------------------------------- | -------------------------------------- | --- |
| CNAME | `resend._domainkey.voidcraft.app` | `resend._domainkey.<region>.amazonses.com` | 300 |
| CNAME | `resend2._domainkey.voidcraft.app` | `resend2._domainkey.<region>.amazonses.com` | 300 |

Two records so Resend can rotate keys without downtime. Keep both.

## 4. DMARC — what to do with failing mail

Start in **quarantine** mode with 100% coverage and a reporting address.
After a week of clean reports, you can flip `p=quarantine` to `p=reject`.

| Type | Host                | Value                                                                                              | TTL |
| ---- | ------------------- | -------------------------------------------------------------------------------------------------- | --- |
| TXT  | `_dmarc.voidcraft.app` | `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@voidcraft.app; adkim=s; aspf=s; fo=1`           | 300 |

Notes:
- `rua` = aggregate reports. Use a mailbox you actually check; Postmark and
  Cloudflare offer free DMARC report parsing if you don't want to read raw XML.
- `adkim=s` / `aspf=s` = strict alignment. Loosen to `r` only if you have a
  specific reason (rare for SaaS).

## 5. Verify

After ~15 min, run:

```bash
# SPF
dig +short TXT voidcraft.app | grep spf

# DKIM (replace selector if Resend gave you a different one)
dig +short CNAME resend._domainkey.voidcraft.app

# DMARC
dig +short TXT _dmarc.voidcraft.app
```

Or use https://mxtoolbox.com/SuperTool.aspx — paste the domain, run **SPF**,
**DKIM** (selector `resend`), and **DMARC** checks.

Send yourself a test email from the Resend dashboard and check the inbox
headers: `Authentication-Results` should show `spf=pass`, `dkim=pass`,
`dmarc=pass`.

## 6. Common gotchas

- **Two SPF records** — only one TXT record may start with `v=spf1`. Merge.
- **Trailing dot on CNAME** — some registrars strip it. If Resend says
  "unverified" after 24h, re-paste exactly as shown including the trailing
  dot (or strip it, depending on what the registrar expects).
- **Apex CNAME** — never CNAME the apex (`@`). The DKIM CNAMEs are on
  subdomains (`resend._domainkey`), so this isn't an issue here.
- **Forwarding** — DKIM survives forwarding; SPF often doesn't (because the
  forwarding server isn't in your SPF). DMARC `p=reject` can break
  legitimate forwarders. Stay on `quarantine` for the first month.

## 7. After DNS is live

Update `.env`:

```
RESEND_FROM_EMAIL=VOIDCRAFT <hello@voidcraft.app>
```

Redeploy. Send a real signup → confirm the welcome email arrives signed by
your domain (check headers).
