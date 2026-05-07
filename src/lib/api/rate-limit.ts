import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── In-memory sliding window fallback ───────────────────────────────────────

const memStore = new Map<string, number[]>();

/** For test cleanup only — do not call in production code. */
export function resetInMemoryStore() {
  memStore.clear();
}

export function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: Date } {
  const now = Date.now();
  const timestamps = (memStore.get(identifier) ?? []).filter(
    (t) => now - t < windowMs
  );
  timestamps.push(now);
  memStore.set(identifier, timestamps);

  const success = timestamps.length <= limit;
  return {
    success,
    limit,
    remaining: Math.max(0, limit - timestamps.length),
    reset: new Date(now + windowMs),
  };
}

// ─── Redis client ─────────────────────────────────────────────────────────────

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "ratelimit:api",
    })
  : null;

export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

export const challengeRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 h"),
      analytics: true,
      prefix: "ratelimit:challenge",
    })
  : null;

// ─── Fallback configs (mirrors Redis limiter settings) ────────────────────────

const fallbacks = {
  api: { limit: 10, windowMs: 10_000 },
  auth: { limit: 5, windowMs: 60_000 },
  challenge: { limit: 3, windowMs: 3_600_000 },
} as const;

type FallbackKey = keyof typeof fallbacks;

// ─── Unified check ────────────────────────────────────────────────────────────

/**
 * Check rate limit for a given identifier.
 * Falls back to in-memory sliding window when Redis is not configured.
 * Pass fallbackKey matching the limiter type to activate the fallback.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
  fallbackKey?: FallbackKey
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  if (!limiter) {
    if (fallbackKey) {
      const { limit, windowMs } = fallbacks[fallbackKey];
      return inMemoryRateLimit(identifier, limit, windowMs);
    }
    return { success: true, limit: 0, remaining: 0, reset: new Date() };
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return { success, limit, remaining, reset: new Date(reset) };
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const cfConnectingIp = headers.get("cf-connecting-ip");

  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  return "unknown";
}
