import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client (will be undefined if env vars not set)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

/**
 * Rate limiter for API routes
 * 10 requests per 10 seconds per IP
 */
export const apiRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '10 s'),
        analytics: true,
        prefix: 'ratelimit:api',
    })
    : null;

/**
 * Rate limiter for authentication routes
 * 5 requests per minute per IP (stricter)
 */
export const authRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:auth',
    })
    : null;

/**
 * Rate limiter for challenge creation
 * 3 challenges per hour per user
 */
export const challengeRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        analytics: true,
        prefix: 'ratelimit:challenge',
    })
    : null;

/**
 * Check rate limit for a given identifier
 * Returns { success: boolean, limit: number, remaining: number, reset: Date }
 */
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: Date;
}> {
    // If rate limiting is not configured, allow all requests
    if (!limiter) {
        return {
            success: true,
            limit: 0,
            remaining: 0,
            reset: new Date(),
        };
    }

    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    return {
        success,
        limit,
        remaining,
        reset: new Date(reset),
    };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(headers: Headers): string {
    // Check various headers for IP address
    const forwarded = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const cfConnectingIp = headers.get('cf-connecting-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    return 'unknown';
}
