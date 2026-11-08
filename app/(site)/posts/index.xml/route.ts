import { buildFeed } from "@/lib/feed";
import { getPublishedPosts } from "@/lib/posts";

export const revalidate = 300;

export async function GET() {
  const posts = await getPublishedPosts().catch(() => []);
  return new Response(buildFeed(posts, undefined, "/posts/index.xml"), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
