import type { MetadataRoute } from "next";
import { getPublishedPostsForSitemap } from "@/lib/posts";
import { CATEGORIES } from "@/lib/post-schema";
import { SITE, SITE_URL } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPostsForSitemap().catch(() => []);
  const perPage = SITE.postsPerPage;
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage));
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/posts/`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about/`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/counseling/`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact/`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}/`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const listingRoutes: MetadataRoute.Sitemap = [];
  for (const category of CATEGORIES) {
    const count = posts.filter((post) => post.categories.includes(category)).length;
    const pages = Math.max(1, Math.ceil(count / perPage));
    listingRoutes.push({
      url: `${SITE_URL}/categories/${category}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (let page = 2; page <= pages; page++) {
      listingRoutes.push({
        url: `${SITE_URL}/categories/${category}/page/${page}/`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.4,
      });
    }
  }

  for (let page = 2; page <= totalPages; page++) {
    listingRoutes.push({
      url: `${SITE_URL}/posts/page/${page}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    });
  }

  return [...staticRoutes, ...postRoutes, ...listingRoutes];
}
