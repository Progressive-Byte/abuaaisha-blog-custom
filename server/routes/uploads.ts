import { Router } from "express";
import { z } from "zod";
import { json, route } from "../lib/http";
import { requireAuth } from "../lib/auth";
import { destroyAsset, signUpload, verifyAsset } from "../lib/cloudinary";
import { assertValid } from "../lib/validate";

export const uploadRoutes = Router();

uploadRoutes.use(requireAuth);

uploadRoutes.post(
  "/uploads/sign",
  route(async (req, res) => {
    const body = assertValid(z.object({ folder: z.string().max(120).optional() }).safeParse(req.body ?? {}));
    json(res, signUpload(body.folder));
  }),
);

uploadRoutes.post(
  "/uploads/verify",
  route(async (req, res) => {
    const body = assertValid(
      z.object({ url: z.string().url(), publicId: z.string().max(500).optional() }).safeParse(req.body),
    );
    json(res, verifyAsset(body.url, body.publicId));
  }),
);

uploadRoutes.post(
  "/uploads/delete",
  route(async (req, res) => {
    const body = assertValid(z.object({ publicId: z.string().min(1).max(500) }).safeParse(req.body));
    await destroyAsset(body.publicId);
    json(res, { ok: true });
  }),
);
