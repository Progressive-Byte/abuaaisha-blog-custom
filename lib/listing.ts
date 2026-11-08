import { SITE } from "./site";
import type { PostRecord } from "./types";

export type Sort = "new" | "old";

export interface ListingPage {
  posts: PostRecord[];
  current: number;
  total: number;
  sort: Sort;
}

export function listingSegments(segments: string[]): { sort: Sort; page: number } | null {
  if (segments.length === 0) return { sort: "new", page: 1 };
  if (segments.length === 1 && segments[0] === "oldest") return { sort: "old", page: 1 };
  if (segments.length === 2 && segments[0] === "page") {
    const page = Number(segments[1]);
    return Number.isInteger(page) && page >= 1 ? { sort: "new", page } : null;
  }
  if (segments.length === 3 && segments[0] === "oldest" && segments[1] === "page") {
    const page = Number(segments[2]);
    return Number.isInteger(page) && page >= 1 ? { sort: "old", page } : null;
  }
  return null;
}

export function buildListing(all: PostRecord[], sort: Sort, page: number): ListingPage {
  const ordered = sort === "new" ? all : [...all].reverse();
  const perPage = SITE.postsPerPage;
  const total = Math.max(1, Math.ceil(all.length / perPage));
  const safePage = Math.min(Math.max(page, 1), total);
  return {
    posts: ordered.slice((safePage - 1) * perPage, safePage * perPage),
    current: safePage,
    total,
    sort,
  };
}

export function listingHref(base: string, sort: Sort, page: number): string {
  const root = sort === "old" ? `${base}oldest/` : base;
  return page === 1 ? root : `${root}page/${page}/`;
}

export function parseListingSlug(segments: string[] | undefined): { sort: Sort; page: number } | null {
  return listingSegments(segments ?? []);
}
