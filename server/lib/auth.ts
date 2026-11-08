import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "../../lib/auth";
import { HttpError } from "./http";

export interface AuthedRequest extends Request {
  adminEmail?: string;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

export async function validateCredentials(email: string, password: string): Promise<void> {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedEmail || !hash) throw new HttpError(500, "Admin credentials are not configured");

  if (email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) {
    throw new HttpError(401, "Invalid email or password");
  }
  const ok = await bcrypt.compare(password, hash);
  if (!ok) throw new HttpError(401, "Invalid email or password");
}

export async function issueSession(res: Response, email: string): Promise<void> {
  const token = await signSession(email);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function currentSession(req: Request): Promise<{ email: string } | null> {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  return verifySession(token);
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await currentSession(req);
    if (!session) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    req.adminEmail = session.email;
    next();
  } catch {
    res.status(401).json({ error: "Authentication required" });
  }
}

/** Reject cross-site writes even though the session cookie is SameSite=Lax. */
export function checkOrigin(req: Request, res: Response, next: NextFunction): void {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }

  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  try {
    const originHost = new URL(origin).host;
    if (host && originHost === host) {
      next();
      return;
    }
  } catch {
    // fall through
  }

  res.status(403).json({ error: "Cross-site request rejected" });
}
