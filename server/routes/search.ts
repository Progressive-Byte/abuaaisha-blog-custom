import { Router } from "express";
import { z } from "zod";
import { clientIp, HttpError, json, route } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { assertValid } from "../lib/validate";
import { searchPosts } from "../../lib/posts";

export const searchRoutes = Router();

const querySchema = z.object({ q: z.string().trim().min(2).max(120) });

searchRoutes.get(
  "/search",
  route(async (req, res) => {
    const parsed = assertValid(querySchema.safeParse({ q: req.query.q }));
    const limited = await rateLimit(`search:${clientIp(req)}`, 60, 60 * 1000);
    if (!limited.allowed) throw new HttpError(429, "Too many searches. Please slow down.");

    const results = await searchPosts(parsed.q, 6);
    json(res, { results });
  }),
);
