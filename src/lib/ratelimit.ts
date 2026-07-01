import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window, in-memory rate limiter. Good enough to blunt scripted abuse
 * from a single serverless instance; it is not shared across instances, so
 * treat it as a speed bump rather than a hard guarantee.
 */

type Result = { success: boolean; remaining: number };

const memory = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  opts: { limit: number; windowSec: number },
): Result {
  const now = Date.now();
  const entry = memory.get(key);

  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + opts.windowSec * 1000 });
    return { success: true, remaining: opts.limit - 1 };
  }

  entry.count += 1;
  // Opportunistic cleanup to keep the map bounded.
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.resetAt < now) memory.delete(k);
  }
  return {
    success: entry.count <= opts.limit,
    remaining: Math.max(0, opts.limit - entry.count),
  };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const store = await headers();
  const xff = store.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return store.get("x-real-ip") ?? "unknown";
}
