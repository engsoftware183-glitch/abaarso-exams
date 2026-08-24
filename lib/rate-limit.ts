// ======================================================
// MINIMAL IN-MEMORY RATE LIMITER
// ======================================================
//
// PRODUCTION LIMITATION: this store is per-process memory. It works
// correctly for a single long-running Node server, but resets on
// deploy/restart and is NOT shared across multiple instances or
// serverless invocations. The project has no existing rate-limiting
// solution and no Redis/persistent store configured, so this is the
// safest minimal option available without inventing new infrastructure.
// For a multi-instance/serverless deployment, replace this with a
// database-backed or provider-backed limiter (e.g. a Postgres table
// keyed by (key, window) using the existing Prisma connection, or a
// managed rate-limit service).

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
