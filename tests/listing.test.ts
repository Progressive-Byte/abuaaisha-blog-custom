import { describe, expect, it } from "vitest";
import { buildListing, listingHref, listingSegments } from "../lib/listing";
import type { PostRecord } from "../lib/types";

function makePosts(count: number): PostRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    slug: `0${index}f01`,
    title: `Post ${index}`,
    summary: "",
    body: "",
    categories: ["faith"],
    lang: "bn",
    status: "published",
    publishedAt: new Date(2026, 0, index + 1),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

describe("listingSegments", () => {
  it("parses page 1", () => {
    expect(listingSegments([])).toEqual({ sort: "new", page: 1 });
  });

  it("parses oldest and numbered pages", () => {
    expect(listingSegments(["oldest"])).toEqual({ sort: "old", page: 1 });
    expect(listingSegments(["page", "2"])).toEqual({ sort: "new", page: 2 });
    expect(listingSegments(["oldest", "page", "3"])).toEqual({ sort: "old", page: 3 });
  });

  it("rejects invalid segments", () => {
    expect(listingSegments(["page", "x"])).toBeNull();
    expect(listingSegments(["nope"])).toBeNull();
    expect(listingSegments(["page", "0"])).toBeNull();
  });
});

describe("buildListing", () => {
  it("paginates 25 posts into 3 pages of 12", () => {
    const posts = makePosts(25);
    const first = buildListing(posts, "new", 1);
    expect(first.posts).toHaveLength(12);
    expect(first.total).toBe(3);

    const last = buildListing(posts, "new", 3);
    expect(last.posts).toHaveLength(1);
  });

  it("clamps out-of-range pages", () => {
    expect(buildListing(makePosts(3), "new", 9).current).toBe(1);
  });

  it("reverses for oldest-first", () => {
    const posts = makePosts(3);
    expect(buildListing(posts, "old", 1).posts[0].id).toBe("2");
  });

  it("builds canonical hrefs", () => {
    expect(listingHref("/posts/", "new", 1)).toBe("/posts/");
    expect(listingHref("/posts/", "new", 2)).toBe("/posts/page/2/");
    expect(listingHref("/posts/", "old", 1)).toBe("/posts/oldest/");
    expect(listingHref("/posts/", "old", 2)).toBe("/posts/oldest/page/2/");
  });
});
