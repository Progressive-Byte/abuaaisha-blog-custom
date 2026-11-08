import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewActions } from "@/components/admin/PreviewActions";
import { PostArticle } from "@/components/PostArticle";
import { getPostById, getPublishedPosts, relatedPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const published = await getPublishedPosts().catch(() => []);
  const related = relatedPosts(
    published.filter((item) => item.id !== post.id),
    post,
  );

  return (
    <div className="a-stack">
      <PreviewActions id={post.id} status={post.status} />
      <PostArticle post={post} related={related} preview />
    </div>
  );
}
