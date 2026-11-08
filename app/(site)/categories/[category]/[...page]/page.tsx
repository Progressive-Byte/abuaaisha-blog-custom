import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { PageIntro } from "@/components/PageIntro";
import { buildListing, listingHref, listingSegments } from "@/lib/listing";
import { getPublishedPosts, inCategory } from "@/lib/posts";
import { CATEGORIES, isCategory } from "@/lib/post-schema";
import { CATEGORY_META, SITE } from "@/lib/site";
import { toBanglaDigits } from "@/lib/format";
import styles from "../../../posts/listing.module.css";

export const revalidate = 300;
export const dynamicParams = true;

type Params = Promise<{ category: string; page?: string[] }>;

export async function generateStaticParams() {
  const posts = await getPublishedPosts().catch(() => []);
  const params: { category: string; page: string[] }[] = [];
  for (const category of CATEGORIES) {
    params.push({ category, page: ["oldest"] });
    const total = Math.max(1, Math.ceil(inCategory(posts, category).length / SITE.postsPerPage));
    for (let page = 2; page <= total; page++) {
      params.push({ category, page: ["page", String(page)] });
      params.push({ category, page: ["oldest", "page", String(page)] });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, page = [] } = await params;
  if (!isCategory(category)) return {};
  const meta = CATEGORY_META[category];
  const parsed = listingSegments(page);
  if (!parsed) return {};
  const posts = inCategory(await getPublishedPosts().catch(() => []), category);
  const listing = buildListing(posts, parsed.sort, parsed.page);
  const suffix = listing.current > 1 ? ` — পাতা ${toBanglaDigits(listing.current)}` : "";
  return {
    title: `${meta.label}${suffix}`,
    description: `${meta.label}: ${meta.blurb}`,
    alternates: { canonical: listingHref(`/categories/${category}/`, listing.sort, listing.current) },
  };
}

export default async function CategoryListingPage({ params }: { params: Params }) {
  const { category, page = [] } = await params;
  if (!isCategory(category)) notFound();

  const parsed = listingSegments(page);
  if (!parsed) notFound();

  const meta = CATEGORY_META[category];
  const posts = inCategory(await getPublishedPosts(), category);
  const listing = buildListing(posts, parsed.sort, parsed.page);

  return (
    <div className={`container ${styles.listing}`}>
      <PageIntro title={meta.label} lede={meta.blurb} />
      <BlogIndex {...listing} category={category} />
    </div>
  );
}
