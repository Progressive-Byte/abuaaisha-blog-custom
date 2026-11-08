import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PostArticle } from "@/components/PostArticle";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getPostById, getPublishedPosts, relatedPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "Post preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EmbeddedPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login/");

  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const published = await getPublishedPosts().catch(() => []);
  const related = relatedPosts(
    published.filter((item) => item.id !== post.id),
    post,
  );

  return (
    <div className="a-preview-embed">
      <PostArticle post={post} related={related} preview />
    </div>
  );
}
