import type { PostRecord } from "./types";
import { SITE, SITE_URL } from "./site";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildFeed(posts: PostRecord[], title: string = SITE.nameEn, selfPath = "/index.xml"): string {
  const items = posts
    .map((post) => {
      const link = `${SITE_URL}/posts/${post.slug}/`;
      const categories = post.categories.map((category) => `      <category>${escapeXml(category)}</category>`).join("\n");
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <description>${escapeXml(post.description ?? post.summary)}</description>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${post.publishedAt.toUTCString()}</pubDate>`,
        categories,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>bn</language>
    <atom:link href="${SITE_URL}${selfPath}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}
