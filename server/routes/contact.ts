import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { ContactMessageModel } from "../lib/models/models";
import { clientIp, HttpError, json, route } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { assertValid } from "../lib/validate";
import { sendContactEmail } from "../lib/email";

export const contactRoutes = Router();

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("A valid email is required").max(200),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(5, "Message is too short").max(5000),
  botField: z.string().max(500).optional(),
});

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(`${ip}:${process.env.SESSION_SECRET ?? "salt"}`).digest("hex").slice(0, 32);
}

contactRoutes.post(
  "/contact",
  route(async (req, res) => {
    const input = assertValid(contactSchema.safeParse(req.body));

    // Honeypot: pretend success, store nothing.
    if (input.botField && input.botField.trim().length > 0) {
      json(res, { ok: true });
      return;
    }

    const ip = clientIp(req);
    const limited = await rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
    if (!limited.allowed) throw new HttpError(429, "Too many messages. Please try again later.");

    const record = await ContactMessageModel.create({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      ipHash: hashIp(ip),
      emailStatus: "stored",
    });

    try {
      const status = await sendContactEmail(input);
      record.emailStatus = status;
      await record.save();
    } catch (error) {
      record.emailStatus = "failed";
      await record.save();
      console.error("[contact] email send failed", error);
    }

    json(res, { ok: true });
  }),
);
