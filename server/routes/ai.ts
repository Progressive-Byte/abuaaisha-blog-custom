import { Router } from "express";
import { generateDraft, aiRequestSchema } from "../lib/ai";
import { HttpError, json, route } from "../lib/http";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { rateLimit } from "../lib/rate-limit";
import { assertValid } from "../lib/validate";

export const aiRoutes = Router();

aiRoutes.use(requireAuth);

aiRoutes.post(
  "/ai/generate",
  route(async (req, res) => {
    const input = assertValid(aiRequestSchema.safeParse(req.body));
    const email = (req as AuthedRequest).adminEmail ?? "admin";
    const limit = Number(process.env.AI_DAILY_LIMIT ?? 10);

    const attempts = await rateLimit(`ai:${email.toLowerCase()}`, limit, 24 * 60 * 60 * 1000);
    if (!attempts.allowed) {
      throw new HttpError(429, `Daily AI limit (${limit}) reached. Try again in 24 hours.`);
    }

    try {
      const { draft, usage } = await generateDraft(input);
      console.log(JSON.stringify({ event: "ai-draft", by: email, usage }));
      json(res, { draft });
    } catch (error) {
      console.error("[ai] generation failed", error);
      throw new HttpError(502, "AI generation failed. Please try again or adjust the prompt.");
    }
  }),
);
