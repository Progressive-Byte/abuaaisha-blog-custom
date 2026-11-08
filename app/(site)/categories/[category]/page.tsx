import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { PageIntro } from "@/components/PageIntro";
import { buildListing } from "@/lib/listing";
import { getPublishedPosts, inCategory } from "@/lib/posts";
import { CATEGORIES, isCategory } from "@/lib/post-schema";
import { CATEGORY_META } from "@/lib/site";
import styles from "../../posts/listing.module.css";

export const revalidate = 300;

type Params = Promise<{ category: string }>;

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};
  const meta = CATEGORY_META[category];
  return {
    title: meta.label,
    description: `${meta.label}: ${meta.blurb}`,
    alternates: { canonical: `/categories/${category}/` },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  const meta = CATEGORY_META[category];
  const posts = inCategory(await getPublishedPosts(), category);
  const listing = buildListing(posts, "new", 1);

  return (
    <div className={`container ${styles.listing}`}>
      <PageIntro title={meta.label} lede={meta.blurb} />
      <BlogIndex {...listing} category={category} />
    </div>
  );
}
