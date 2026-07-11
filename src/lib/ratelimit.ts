import "server-only";
import { headers } from "next/headers";
import { lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

/**
 * Fixed-window rate limiter backed by Postgres, so the count is shared across
 * every serverless instance instead of living in one process's memory. The
 * upsert is a single atomic statement: it starts a fresh window when the old
 * one has lapsed, otherwise increments the existing counter.
 */

type Result = { success: boolean };

export async function rateLimit(
  key: string,
  opts: { limit: number; windowSec: number },
): Promise<Result> {
  try {
    const rows = await db
      .insert(rateLimits)
      .values({
        key,
        count: 1,
        resetAt: sql`now() + make_interval(secs => ${opts.windowSec})`,
      })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${rateLimits.resetAt} < now() then 1 else ${rateLimits.count} + 1 end`,
          resetAt: sql`case when ${rateLimits.resetAt} < now() then now() + make_interval(secs => ${opts.windowSec}) else ${rateLimits.resetAt} end`,
        },
      })
      .returning({ count: rateLimits.count });

    // Opportunistic cleanup so long-expired windows don't pile up.
    if (Math.random() < 0.02) {
      await db
        .delete(rateLimits)
        .where(lt(rateLimits.resetAt, sql`now() - interval '1 day'`))
        .catch(() => {});
    }

    return { success: (rows[0]?.count ?? 1) <= opts.limit };
  } catch (err) {
    // Fail open: if the limiter itself errors, the guarded action still runs
    // (and will surface its own DB error if the database is truly down).
    console.error("rateLimit failed", err);
    return { success: true };
  }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const store = await headers();
  const xff = store.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return store.get("x-real-ip") ?? "unknown";
}
