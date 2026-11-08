import { cache } from "react";
import { connectDb } from "./db";
import { PostModel } from "../server/lib/models/models";
import type { Category } from "./post-schema";
import type { PostRecord } from "./types";

type LeanPost = Record<string, unknown> & {
  _id: unknown;
  slug: string;
  title: string;
  summary: string;
  body: string;
  categories: Category[];
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function toRecord(doc: LeanPost): PostRecord {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    description: typeof doc.description === "string" ? doc.description : undefined,
    body: doc.body,
    categories: doc.categories,
    lang: (doc.lang as PostRecord["lang"]) ?? "bn",
    status: (doc.status as PostRecord["status"]) ?? "published",
    publishedAt: new Date(doc.publishedAt),
    image: doc.image as PostRecord["image"],
    aiGenerated: doc.aiGenerated as boolean | undefined,
    sources: doc.sources as PostRecord["sources"],
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

const publishedFilter = () => ({
  status: "published" as const,
  publishedAt: { $lte: new Date() },
});

let warnedMissingDb = false;

function hasDb(): boolean {
  if (process.env.MONGODB_URI) return true;
  if (!warnedMissingDb) {
    console.warn("[db] MONGODB_URI is not set — public content will render empty until it is configured.");
    warnedMissingDb = true;
  }
  return false;
}

// cache() dedupes identical DB reads within one server render (e.g. generateMetadata + page).
export const getPublishedPosts = cache(async (): Promise<PostRecord[]> => {
  if (!hasDb()) return [];
  await connectDb();
  const docs = await PostModel.find(publishedFilter())
    .sort({ publishedAt: -1, slug: -1 })
    .lean<LeanPost[]>();
  return docs.map(toRecord);
});

export const getPublishedPostBySlug = cache(async (slug: string): Promise<PostRecord | null> => {
  if (!/^\d{3}[fsw]\d{2,}$/.test(slug)) return null;
  if (!hasDb()) return null;
  await connectDb();
  const doc = await PostModel.findOne({ ...publishedFilter(), slug }).lean<LeanPost | null>();
  return doc ? toRecord(doc) : null;
});

export const getPostById = cache(async (id: string): Promise<PostRecord | null> => {
  if (!hasDb()) return null;
  await connectDb();
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const doc = await PostModel.findById(id).lean<LeanPost | null>();
  return doc ? toRecord(doc) : null;
});

export const getPublishedSlugs = cache(async (): Promise<string[]> => {
  if (!hasDb()) return [];
  await connectDb();
  const docs = await PostModel.find(publishedFilter()).select("slug -_id").lean<{ slug: string }[]>();
  return docs.map((d) => d.slug);
});

export const getPostCounts = cache(async (): Promise<{ total: number; published: number; draft: number }> => {
  if (!hasDb()) return { total: 0, published: 0, draft: 0 };
  await connectDb();
  const [total, published] = await Promise.all([
    PostModel.countDocuments({}),
    PostModel.countDocuments({ status: "published" }),
  ]);
  return { total, published, draft: total - published };
});

export interface SitemapPost {
  slug: string;
  categories: Category[];
  updatedAt: Date;
}

/** Sitemap only needs slug/categories/date — avoid loading full Markdown bodies. */
export const getPublishedPostsForSitemap = cache(async (): Promise<SitemapPost[]> => {
  if (!hasDb()) return [];
  await connectDb();
  return PostModel.find(publishedFilter())
    .select("slug categories updatedAt -_id")
    .sort({ publishedAt: -1, slug: -1 })
    .lean<SitemapPost[]>();
});

export function inCategory(posts: PostRecord[], category: Category): PostRecord[] {
  return posts.filter((p) => p.categories.includes(category));
}

export function relatedPosts(posts: PostRecord[], current: PostRecord, count = 3): PostRecord[] {
  const others = posts.filter((p) => p.id !== current.id);
  const same = others.filter((p) => p.categories.some((c) => current.categories.includes(c)));
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, count);
}

export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function excerpt(markdown: string, query: string): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const index = plain.toLowerCase().indexOf(query.toLowerCase());
  const start = Math.max(0, index - 60);
  return plain.slice(start, start + 180).trim();
}

export async function searchPosts(query: string, limit = 6): Promise<{ url: string; title: string; excerpt: string }[]> {
  const q = query.trim();
  if (q.length < 2 || !hasDb()) return [];
  await connectDb();
  const re = new RegExp(escapeRegex(q), "i");
  const docs = await PostModel.find({
    ...publishedFilter(),
    $or: [{ title: re }, { summary: re }, { body: re }],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("slug title summary body")
    .lean<{ slug: string; title: string; summary: string; body: string }[]>();

  return docs.map((d) => ({
    url: `/posts/${d.slug}/`,
    title: d.title,
    excerpt: excerpt(d.body, q) || d.summary,
  }));
}
