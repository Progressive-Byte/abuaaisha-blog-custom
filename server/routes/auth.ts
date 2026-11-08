import { Router } from "express";
import { z } from "zod";
import { clientIp, HttpError, json, route } from "../lib/http";
import { clearSession, currentSession, issueSession, validateCredentials } from "../lib/auth";
import { rateLimit } from "../lib/rate-limit";
import { assertValid } from "../lib/validate";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(500),
});

export const authRoutes = Router();

authRoutes.post(
  "/login",
  route(async (req, res) => {
    const input = assertValid(loginSchema.safeParse(req.body));
    const ip = clientIp(req);

    const attempt = await rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!attempt.allowed) throw new HttpError(429, "Too many attempts. Try again in a few minutes.");

    await validateCredentials(input.email, input.password);
    await issueSession(res, input.email.trim());
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
