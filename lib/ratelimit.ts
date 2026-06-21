import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Returns a configured limiter, or null when Upstash env is missing (dev
// environments without Redis). Callers MUST treat null as "no limiting".
function makeLimiter(prefix: string): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Ratelimit({
    redis: new Redis({ url, token }),
    // 5 attempts per 15-minute sliding window.
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix,
  });
}

// One limiter per route — separate buckets so a brute-force on /login doesn't
// lock out password resets too.
const limiters = {
  login: makeLimiter("rl:login"),
  signup: makeLimiter("rl:signup"),
  forgot: makeLimiter("rl:forgot"),
} as const;

export type LimitedRoute = keyof typeof limiters;

export type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // ms epoch
};

const PASSTHROUGH: LimitResult = {
  success: true,
  limit: 5,
  remaining: 5,
  reset: 0,
};

export async function checkRateLimit(
  route: LimitedRoute,
  identifier: string,
): Promise<LimitResult> {
  const limiter = limiters[route];
  if (!limiter) return PASSTHROUGH;
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return { success, limit, remaining, reset };
}

// Pulls the client IP from the standard proxy headers. Falls back to a
// neutral string so we never throw.
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// Server-action friendly version — reads the request headers via next/headers
// instead of taking them as an argument. Use this from server actions and
// route handlers, not from middleware.
export async function getClientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  return clientIp(await headers());
}
