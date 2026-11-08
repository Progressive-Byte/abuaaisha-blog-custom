import type { Metadata } from "next";
import { PostList } from "@/components/admin/PostList";

export const metadata: Metadata = { title: "Posts" };

export default function AdminPostsPage() {
  return <PostList />;
}
