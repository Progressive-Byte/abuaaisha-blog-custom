import type { Metadata } from "next";
import { PostForm } from "@/components/admin/PostForm";

export const metadata: Metadata = { title: "New post" };

export default function NewPostPage() {
  return <PostForm mode="new" />;
}
