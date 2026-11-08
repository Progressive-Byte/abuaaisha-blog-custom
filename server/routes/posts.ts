import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { PostModel, type PostDocument } from "../lib/models/models";
import { HttpError, json, route } from "../lib/http";
import { requireAuth } from "../lib/auth";
import { assertValid } from "../lib/validate";
import { revalidatePublicPages } from "../lib/revalidate";
import { destroyAsset } from "../lib/cloudinary";
import { postInputSchema, POST_STATUSES } from "../../lib/post-schema";

export const postRoutes = Router();

postRoutes.use(requireAuth);

type LeanAdminPost = PostDocument & { _id: unknown };

function toAdminPost(doc: LeanAdminPost) {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    description: doc.description ?? "",
    body: doc.body,
    categories: doc.categories,
    lang: doc.lang,
    status: doc.status,
    publishedAt: new Date(doc.publishedAt).toISOString(),
    image: doc.image ?? null,
    aiGenerated: Boolean(doc.aiGenerated),
    sources: doc.sources ?? [],
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

function toSummary(doc: LeanAdminPost) {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    categories: doc.categories,
    lang: doc.lang,
    status: doc.status,
    publishedAt: new Date(doc.publishedAt).toISOString(),
    image: doc.image ?? null,
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(POST_STATUSES).optional(),
  category: z.enum(["faith", "social", "worldview"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
});

postRoutes.get(
  "/posts",
  route(async (req, res) => {
    const query = assertValid(listQuerySchema.safeParse(req.query));
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.categories = query.category;
    if (query.q) {
      const re = new RegExp(escapeRegex(query.q), "i");
      filter.$or = [{ title: re }, { summary: re }, { slug: re }];
    }

    const skip = (query.page - 1) * query.perPage;
    const [docs, total] = await Promise.all([
      PostModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(query.perPage)
        .select("-body")
        .lean<LeanAdminPost[]>(),
      PostModel.countDocuments(filter),
    ]);

    json(res, {
      posts: docs.map(toSummary),
      total,
      page: query.page,
      perPage: query.perPage,
      pages: Math.max(1, Math.ceil(total / query.perPage)),
    });
  }),
);

postRoutes.get(
  "/stats",
  route(async (_req, res) => {
    const [total, published, drafts, recent] = await Promise.all([
      PostModel.countDocuments({}),
      PostModel.countDocuments({ status: "published" }),
      PostModel.countDocuments({ status: "draft" }),
      PostModel.find({}).sort({ updatedAt: -1 }).limit(5).select("-body").lean<LeanAdminPost[]>(),
    ]);
    json(res, { total, published, drafts, recent: recent.map(toSummary) });
  }),
);

postRoutes.get(
  "/posts/:id",
  route(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Post not found");
    const doc = await PostModel.findById(id).lean<LeanAdminPost | null>();
    if (!doc) throw new HttpError(404, "Post not found");
    json(res, { post: toAdminPost(doc) });
  }),
);

postRoutes.post(
  "/posts",
  route(async (req, res) => {
    const input = assertValid(postInputSchema.safeParse(req.body));
    const exists = await PostModel.exists({ slug: input.slug });
    if (exists) throw new HttpError(409, "That slug is already used by another post");

    const doc = await PostModel.create({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      description: input.description || undefined,
      body: input.body,
      categories: input.categories,
      lang: input.lang,
      status: input.status,
      publishedAt: input.publishedAt,
      image: input.image,
      aiGenerated: input.aiGenerated,
      sources: input.sources?.length ? input.sources : undefined,
    });

    await revalidatePublicPages();
    json(res, { post: toAdminPost(doc.toObject() as LeanAdminPost) }, 201);
  }),
);

postRoutes.patch(
  "/posts/:id",
  route(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Post not found");

    const input = assertValid(postInputSchema.safeParse(req.body));
    const existing = await PostModel.findById(id);
    if (!existing) throw new HttpError(404, "Post not found");

    const clash = await PostModel.exists({ slug: input.slug, _id: { $ne: id } });
    if (clash) throw new HttpError(409, "That slug is already used by another post");

    const previousImage = existing.image?.publicId;
    existing.set({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      description: input.description || undefined,
      body: input.body,
      categories: input.categories,
      lang: input.lang,
      status: input.status,
      publishedAt: input.publishedAt,
      image: input.image,
      aiGenerated: input.aiGenerated,
      sources: input.sources?.length ? input.sources : undefined,
    });
    await existing.save();

    if (previousImage && previousImage !== input.image?.publicId) await destroyAsset(previousImage);
    await revalidatePublicPages();
    json(res, { post: toAdminPost(existing.toObject() as LeanAdminPost) });
  }),
);

postRoutes.delete(
  "/posts/:id",
  route(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Post not found");
    const doc = await PostModel.findByIdAndDelete(id);
    if (!doc) throw new HttpError(404, "Post not found");
    if (doc.image?.publicId) await destroyAsset(doc.image.publicId);
    await revalidatePublicPages();
    json(res, { ok: true });
  }),
);

const statusSchema = z.object({ status: z.enum(POST_STATUSES) });

postRoutes.post(
  "/posts/:id/status",
  route(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Post not found");
    const input = assertValid(statusSchema.safeParse(req.body));
    const doc = await PostModel.findByIdAndUpdate(id, { status: input.status }, { new: true });
    if (!doc) throw new HttpError(404, "Post not found");
    await revalidatePublicPages();
    json(res, { post: toAdminPost(doc.toObject() as LeanAdminPost) });
  }),
);
