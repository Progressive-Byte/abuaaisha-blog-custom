import { z } from "zod";

export const CATEGORIES = ["faith", "social", "worldview"] as const;
export type Category = (typeof CATEGORIES)[number];

export const LANGUAGES = ["bn", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_SLUG_PATTERN = /^\d{3}[fsw]\d{2,}$/;

export const postSchema = z
  .object({
    title: z.string().trim().min(1),
    date: z.coerce.date(),
    categories: z.array(z.enum(CATEGORIES)).min(1),
    summary: z.string().trim().min(1),
    description: z.string().trim().optional(),
    image: z
      .string()
      .regex(/^(\/images\/|https:\/\/)/, "image must be a /images/… path or an https URL")
      .optional(),
    imageAlt: z.string().trim().optional(),
    draft: z.boolean(),
    aiGenerated: z.boolean().optional(),
    sources: z
      .array(z.object({ title: z.string().trim().min(1), url: z.url({ protocol: /^https?$/ }) }))
      .optional(),
    lang: z.enum(LANGUAGES).default("bn"),
  })
  .refine((post) => !post.image || !!post.imageAlt, {
    message: "imageAlt is required when image is set",
    path: ["imageAlt"],
  });

export type PostData = z.infer<typeof postSchema>;

export const sourceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  url: z.url({ protocol: /^https?$/ }),
});

export const slugSchema = z
  .string()
  .trim()
  .regex(POST_SLUG_PATTERN, "Slug must look like 033s22 (3 digits, f/s/w, then 2+ digits)");

export const postInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(300),
    slug: slugSchema,
    summary: z.string().trim().min(1, "Summary is required").max(1000),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    body: z.string().min(1, "Body is required").max(200_000),
    categories: z.array(z.enum(CATEGORIES)).min(1, "Choose at least one category"),
    lang: z.enum(LANGUAGES).default("bn"),
    status: z.enum(POST_STATUSES).default("draft"),
    publishedAt: z.coerce.date(),
    image: z
      .object({
        url: z.url({ protocol: /^https?$/ }),
        publicId: z.string().max(500).optional(),
        alt: z.string().trim().min(1, "Alt text is required when a cover is set").max(500),
      })
      .optional(),
    aiGenerated: z.boolean().optional(),
    sources: z.array(sourceSchema).max(30).optional(),
  })
  .superRefine((post, ctx) => {
    if (post.image && !post.image.alt.trim()) {
      ctx.addIssue({ code: "custom", path: ["image", "alt"], message: "Alt text is required" });
    }
  });

export type PostInput = z.infer<typeof postInputSchema>;

export const imageAltSchema = z.string().trim().min(1).max(500);

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
