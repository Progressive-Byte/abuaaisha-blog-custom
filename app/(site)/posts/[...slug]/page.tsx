import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { PageIntro } from "@/components/PageIntro";
import { PostArticle } from "@/components/PostArticle";
import { buildListing, listingHref, listingSegments } from "@/lib/listing";
import { getPublishedPostBySlug, getPublishedPosts, relatedPosts } from "@/lib/posts";
import { toBanglaDigits } from "@/lib/format";
import { SITE, SITE_URL } from "@/lib/site";
import styles from "../listing.module.css";

export const revalidate = 300;
export const dynamicParams = true;

type Params = Promise<{ slug?: string[] }>;

export async function generateStaticParams() {
  const posts = await getPublishedPosts().catch(() => []);
  const total = Math.max(1, Math.ceil(posts.length / SITE.postsPerPage));
  const params: { slug: string[] }[] = posts.map((post) => ({ slug: [post.slug] }));
  params.push({ slug: ["oldest"] });
  for (let page = 2; page <= total; page++) {
    params.push({ slug: ["page", String(page)] });
    params.push({ slug: ["oldest", "page", String(page)] });
  }
  return params;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug = [] } = await params;

  if (slug.length === 1) {
    const post = await getPublishedPostBySlug(slug[0]);
    if (post) {
      const image = post.image?.url ?? SITE.ogImage;
      return {
        title: post.title,
        description: post.description ?? post.summary,
        alternates: { canonical: `/posts/${post.slug}/` },
        openGraph: {
          type: "article",
          title: post.title,
          description: post.description ?? post.summary,
          url: `${SITE_URL}/posts/${post.slug}/`,
          images: [{ url: image, alt: post.image?.alt }],
          locale: post.lang === "en" ? "en_US" : "bn_BD",
          publishedTime: post.publishedAt.toISOString(),
        },
        twitter: {
          card: "summary_large_image",
          title: post.title,
          description: post.description ?? post.summary,
          images: [image],
        },
      };
    }
  }

  const parsed = listingSegments(slug);
  if (parsed) {
    const posts = await getPublishedPosts().catch(() => []);
    const listing = buildListing(posts, parsed.sort, parsed.page);
    const suffix = listing.current > 1 ? ` — পাতা ${toBanglaDigits(listing.current)}` : "";
    return {
      title: `ব্লগ${suffix}`,
      description: "দ্বীন, পরিবার, সন্তান প্রতিপালন আর সমকালীন সমাজ নিয়ে সব লেখা এক জায়গায়।",
      alternates: { canonical: listingHref("/posts/", listing.sort, listing.current) },
    };
  }

  return {};
}

export default async function PostOrListingPage({ params }: { params: Params }) {
  const { slug = [] } = await params;

  if (slug.length === 1) {
    const post = await getPublishedPostBySlug(slug[0]);
    if (post) {
      const posts = await getPublishedPosts();
      const index = posts.findIndex((item) => item.id === post.id);
      return (
        <PostArticle
          post={post}
          newer={posts[index - 1]}
          older={posts[index + 1]}
          related={relatedPosts(posts, post)}
        />
      );
    }
  }

  const parsed = listingSegments(slug);
  if (!parsed) notFound();

  const posts = await getPublishedPosts();
  const listing = buildListing(posts, parsed.sort, parsed.page);

  return (
    <div className={`container ${styles.listing}`}>
      <PageIntro title="ব্লগ" lede="দ্বীন, পরিবার, সন্তান প্রতিপালন আর সমকালীন সমাজ নিয়ে সব লেখা এক জায়গায়।" />
      <BlogIndex {...listing} />
    </div>
  );
}
