import { connectDb } from "../../lib/db";
import { RateLimitModel } from "./models/models";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Fixed-window limiter backed by MongoDB so it survives serverless scaling.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  await connectDb();
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const existing = await RateLimitModel.findOne({ key }).lean<{ count: number; resetAt: Date } | null>();
  if (!existing || new Date(existing.resetAt) <= now) {
    try {
      await RateLimitModel.updateOne({ key }, { $set: { count: 1, resetAt } }, { upsert: true });
      return { allowed: true, remaining: limit - 1 };
    } catch {
      // Another cold instance created the same counter first; fall through and increment.
    }
  }

  const updated = await RateLimitModel.findOneAndUpdate({ key }, { $inc: { count: 1 } }, { new: true }).lean<{
    count: number;
  } | null>();
  const count = updated?.count ?? (existing?.count ?? 0) + 1;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export async function consumeOrThrow(key: string, limit: number, windowMs: number, message: string): Promise<void> {
  const result = await rateLimit(key, limit, windowMs);
  if (!result.allowed) throw Object.assign(new Error(message), { status: 429, expected: true });
}
