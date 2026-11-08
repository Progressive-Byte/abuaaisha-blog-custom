import { describe, expect, it } from "vitest";
import { SLUG_PATTERN, slugifyTitle, postInputSchema, postSchema } from "../lib/post-schema";

const validPost = {
  title: "Test",
  date: "2026-01-01",
  categories: ["faith"],
  summary: "Summary",
  draft: false,
};

describe("postSchema", () => {
  it("accepts a valid migrated post", () => {
    expect(postSchema.safeParse(validPost).success).toBe(true);
  });

  it("requires alt text when an image is set", () => {
    const result = postSchema.safeParse({ ...validPost, image: "/images/posts/001f01.webp" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown categories", () => {
    expect(postSchema.safeParse({ ...validPost, categories: ["other"] }).success).toBe(false);
  });
});

describe("slug", () => {
  it("accepts legacy numbering and title-style slugs", () => {
    expect(SLUG_PATTERN.test("033s22")).toBe(true);
    expect(SLUG_PATTERN.test("001f01")).toBe(true);
    expect(SLUG_PATTERN.test("hello-world")).toBe(true);
    expect(SLUG_PATTERN.test("সমকালীন-পৃথিবীতে")).toBe(true);
  });

  it("rejects malformed slugs", () => {
    expect(SLUG_PATTERN.test("has space")).toBe(false);
    expect(SLUG_PATTERN.test("-leading")).toBe(false);
    expect(SLUG_PATTERN.test("double--hyphen")).toBe(false);
  });

  it("builds a slug from a title", () => {
    expect(slugifyTitle("Hello, World!")).toBe("hello-world");
    expect(slugifyTitle("A — B")).toBe("a-b");
    expect(slugifyTitle("  সমকালীন পৃথিবীতে  ")).toBe("সমকালীন-পৃথিবীতে");
  });
});

describe("postInputSchema", () => {
  const input = {
    title: "Test",
    slug: "033s22",
    summary: "Summary",
    body: "Body",
    categories: ["social"],
    lang: "bn",
    status: "draft",
    publishedAt: "2026-01-01",
  };

  it("accepts valid admin input", () => {
    expect(postInputSchema.safeParse(input).success).toBe(true);
  });

  it("rejects a malformed slug", () => {
    expect(postInputSchema.safeParse({ ...input, slug: "bad slug" }).success).toBe(false);
  });

  it("requires alt text for a cover", () => {
    const result = postInputSchema.safeParse({
      ...input,
      image: { url: "https://res.cloudinary.com/demo/image/upload/a.webp", publicId: "a", alt: "" },
    });
    expect(result.success).toBe(false);
  });
});
