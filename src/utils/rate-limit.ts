/**
 * Simple in-memory rate limiter
 *
 * Note: Each Scalingo container has its own memory, so this limit effectively is per-container
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();
let lastCleanup = Date.now();

const CLEANUP_INTERVAL = 60_000; // Clean old entries every minute

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, record] of store) {
    if (now > record.resetTime + windowMs) {
      store.delete(key);
    }
  }
}

export function isRateLimited(
  identifier: string, // the IP adress of the visitor
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number } {
  cleanup(windowMs);

  const now = Date.now();
  const record = store.get(identifier);

  // New window or expired
  if (!record || now > record.resetTime) {
    store.set(identifier, { count: 1, resetTime: now + windowMs });
    return { limited: false, remaining: limit - 1 };
  }

  // Within window
  if (record.count >= limit) {
    return { limited: true, remaining: 0 };
  }

  record.count++;
  return { limited: false, remaining: limit - record.count };
}
