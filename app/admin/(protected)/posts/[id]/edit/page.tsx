import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { getPostById } from "@/lib/posts";
import type { AdminPost } from "@/lib/admin-types";

export const metadata: Metadata = { title: "Edit post" };
export const dynamic = "force-dynamic";

function toAdminPost(post: NonNullable<Awaited<ReturnType<typeof getPostById>>>): AdminPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    description: post.description ?? "",
    body: post.body,
    categories: post.categories,
    lang: post.lang,
    status: post.status,
    publishedAt: post.publishedAt.toISOString(),
    image: post.image ?? null,
    aiGenerated: Boolean(post.aiGenerated),
    sources: post.sources ?? [],
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return <PostForm mode="edit" initial={toAdminPost(post)} />;
}
