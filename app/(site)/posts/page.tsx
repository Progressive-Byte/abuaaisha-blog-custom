import type { Metadata } from "next";
import { BlogIndex } from "@/components/BlogIndex";
import { PageIntro } from "@/components/PageIntro";
import { buildListing } from "@/lib/listing";
import { getPublishedPosts } from "@/lib/posts";
import styles from "./listing.module.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ব্লগ",
  description: "দ্বীন, পরিবার, সন্তান প্রতিপালন আর সমকালীন সমাজ নিয়ে সব লেখা এক জায়গায়।",
  alternates: { canonical: "/posts/" },
};

export default async function PostsPage() {
  const posts = await getPublishedPosts();
  const listing = buildListing(posts, "new", 1);

  return (
    <div className={`container ${styles.listing}`}>
      <PageIntro title="ব্লগ" lede="দ্বীন, পরিবার, সন্তান প্রতিপালন আর সমকালীন সমাজ নিয়ে সব লেখা এক জায়গায়।" />
      <BlogIndex {...listing} />
    </div>
  );
}
