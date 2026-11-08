import type { ZodError } from "zod";
import { HttpError } from "./http";

export function assertValid<T>(result: { success: true; data: T } | { success: false; error: ZodError }): T {
  if (!result.success) {
    throw new HttpError(400, result.error.issues.map((issue) => issue.message).join("; "));
  }
  return result.data;
}
