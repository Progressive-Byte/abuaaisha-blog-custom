import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clientIp, HttpError, json, route } from "../lib/http";
import {
  clearSession,
  currentSession,
  issueSession,
  requireAuth,
  validateCredentials,
  type AuthedRequest,
} from "../lib/auth";
import {
  createPasswordResetToken,
  PASSWORD_RESET_TTL_MINUTES,
  resetPasswordWithToken,
  setAdminPassword,
  validateAdminPassword,
} from "../lib/admin";
import { sendPasswordResetEmail } from "../lib/email";
import { rateLimit } from "../lib/rate-limit";
import { assertValid } from "../lib/validate";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(500),
});

const passwordSchema = z.string().min(10, "Password must be at least 10 characters").max(200);

const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(200),
});

const resetSchema = z.object({
  token: z.string().trim().min(20, "Reset token is missing").max(200),
  password: passwordSchema,
});

const changeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(500),
  newPassword: passwordSchema,
});

function resetBaseUrl(req: Request): string {
  const configured = process.env.PASSWORD_RESET_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV !== "production") {
    const origin = req.headers.origin;
    if (origin) return origin.replace(/\/+$/, "");
  }

  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export const authRoutes = Router();

authRoutes.post(
  "/login",
  route(async (req, res) => {
    const input = assertValid(loginSchema.safeParse(req.body));
    const ip = clientIp(req);

    const attempt = await rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!attempt.allowed) throw new HttpError(429, "Too many attempts. Try again in a few minutes.");

    const version = await validateCredentials(input.email, input.password);
    await issueSession(res, input.email.trim(), version);
    json(res, { email: input.email.trim() });
  }),
);

authRoutes.post(
  "/logout",
  route(async (_req, res) => {
    clearSession(res);
    json(res, { ok: true });
  }),
);

authRoutes.get(
  "/me",
  route(async (req, res) => {
    const session = await currentSession(req);
    if (!session) throw new HttpError(401, "Authentication required");
    json(res, { email: session.email });
  }),
);

authRoutes.post(
  "/forgot",
  route(async (req, res) => {
    const input = assertValid(forgotSchema.safeParse(req.body));
    const ip = clientIp(req);

    const attempt = await rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000);
    if (!attempt.allowed) throw new HttpError(429, "Too many requests. Try again in a few minutes.");

    // Always answer the same way so the endpoint cannot be used to probe addresses.
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail || input.email.trim().toLowerCase() !== adminEmail) {
      json(res, { ok: true });
      return;
    }

    const token = await createPasswordResetToken();
    if (!token) throw new HttpError(503, "Password reset is unavailable. Check the server configuration.");

    const resetUrl = `${resetBaseUrl(req)}/admin/reset-password/?token=${encodeURIComponent(token)}`;

    let status: "sent" | "stored";
    try {
      status = await sendPasswordResetEmail({
        to: process.env.PASSWORD_RESET_TO_EMAIL?.trim() || adminEmail,
        resetUrl,
        minutes: PASSWORD_RESET_TTL_MINUTES,
      });
    } catch (error) {
      console.error("[auth] reset email failed", error);
      throw new HttpError(503, "Could not send the reset email. Try again later.");
    }

    if (status !== "sent") throw new HttpError(503, "Email delivery is not configured on the server.");
    json(res, { ok: true });
  }),
);

authRoutes.post(
  "/reset",
  route(async (req, res) => {
    const input = assertValid(resetSchema.safeParse(req.body));
    const ip = clientIp(req);

    const attempt = await rateLimit(`reset:${ip}`, 5, 15 * 60 * 1000);
    if (!attempt.allowed) throw new HttpError(429, "Too many requests. Try again in a few minutes.");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const ok = await resetPasswordWithToken(input.token, passwordHash);
    if (!ok) throw new HttpError(400, "This reset link is invalid or has expired.");

    json(res, { ok: true });
  }),
);

authRoutes.post(
  "/change-password",
  requireAuth,
  route(async (req, res) => {
    const input = assertValid(changeSchema.safeParse(req.body));
    const ip = clientIp(req);

    const attempt = await rateLimit(`change-password:${ip}`, 5, 15 * 60 * 1000);
    if (!attempt.allowed) throw new HttpError(429, "Too many attempts. Try again in a few minutes.");

    if (input.currentPassword === input.newPassword) {
      throw new HttpError(400, "Choose a password different from the current one.");
    }

    const valid = await validateAdminPassword(input.currentPassword);
    if (!valid) throw new HttpError(400, "Current password is incorrect.");

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    const version = await setAdminPassword(passwordHash);
    const email = (req as AuthedRequest).adminEmail ?? process.env.ADMIN_EMAIL ?? "";
    await issueSession(res, email, version);

    json(res, { ok: true });
  }),
);
