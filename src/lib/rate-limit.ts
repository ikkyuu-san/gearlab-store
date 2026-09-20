import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitKind = "admin-login-ip" | "admin-login-account" | "checkout";

const globalForRateLimit = globalThis as unknown as {
  redis?: Redis;
  limiters?: Partial<Record<RateLimitKind, Ratelimit>>;
};

function getLimiter(kind: RateLimitKind) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  globalForRateLimit.redis ??= new Redis({ url, token });
  globalForRateLimit.limiters ??= {};
  globalForRateLimit.limiters[kind] ??= new Ratelimit({
    redis: globalForRateLimit.redis,
    limiter: kind === "checkout" ? Ratelimit.slidingWindow(5, "10 m") : Ratelimit.slidingWindow(5, "15 m"),
    prefix: `gearlab:${kind}`,
  });
  return globalForRateLimit.limiters[kind] ?? null;
}

export function getClientIp(requestHeaders: Headers) {
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
}

export async function enforceRateLimit(kind: RateLimitKind, key: string) {
  const limiter = getLimiter(kind);
  if (!limiter) return { allowed: process.env.NODE_ENV !== "production", configured: false };

  try {
    const result = await limiter.limit(key);
    return { allowed: result.success, configured: true };
  } catch {
    return { allowed: false, configured: true };
  }
}
