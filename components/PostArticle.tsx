import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "./CategoryBadge";
import { CtaBand } from "./CtaBand";
import { Icon } from "./Icon";
import { PostCard } from "./PostCard";
import { PostInteractions } from "./PostInteractions";
import { PostToc } from "./PostToc";
import { formatDualDate, formatIsoDate, readingTimeLabel } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import type { Post } from "@/lib/types";
import { CATEGORY_META, SITE, SITE_URL } from "@/lib/site";
import styles from "./PostArticle.module.css";

interface Props {
  post: Post;
  newer?: Post;
  older?: Post;
  related: Post[];
  preview?: boolean;
}

export async function PostArticle({ post, newer, older, related, preview = false }: Props) {
  const { html, headings } = await renderMarkdown(post.body);
  const toc = headings.filter((heading) => heading.depth === 2);
  const category = post.categories[0];
  const url = `${SITE_URL}/posts/${post.slug}/`;
  const isoDate = formatIsoDate(post.publishedAt);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description ?? post.summary,
    datePublished: post.publishedAt.toISOString(),
    inLanguage: post.lang,
    image: post.image?.url ?? `${SITE_URL}${SITE.ogImage}`,
    author: { "@type": "Person", name: SITE.nameEn, url: `${SITE_URL}/about/` },
    publisher: { "@type": "Organization", name: SITE.nameEn },
    mainEntityOfPage: url,
  };

  return (
    <>
      {!preview ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      <article className={styles.post} lang={post.lang}>
        <header className={`container ${styles.postHead}`}>
          <nav className={styles.crumbs} aria-label="অবস্থান" lang="bn">
            <Link href="/">হোম</Link>
            <span aria-hidden="true">›</span>
            <Link href="/posts/">ব্লগ</Link>
            <span aria-hidden="true">›</span>
            <Link href={`/categories/${category}/`}>{CATEGORY_META[category].label}</Link>
          </nav>
          <CategoryBadge category={category} link />
          <h1>{post.title}</h1>
          <p className={styles.lede}>{post.summary}</p>
          <div className={styles.byline} lang="bn">
            <span className={styles.author}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/site/author.webp" alt="" width="44" height="44" />
              <span>
                <strong>{SITE.name}</strong>
                <small>লেখক</small>
              </span>
            </span>
            <span className={styles.sep} aria-hidden="true" />
            <span className="meta-row">
              <span>
                <Icon name="calendar" />
                <time dateTime={isoDate}>{formatDualDate(post.publishedAt)}</time>
              </span>
              <span>
                <Icon name="clock" />
                {readingTimeLabel(post.body)}
              </span>
            </span>
          </div>
        </header>

        {post.image ? (
          <div className={`container ${styles.coverWrap}`}>
            <Image
              className={styles.cover}
              src={post.image.url}
              alt={post.image.alt}
              width={1170}
              height={785}
              priority
            />
          </div>
        ) : null}

        <div className={`container ${styles.bodyGrid} ${toc.length === 0 ? styles.noToc : ""}`}>
          {toc.length > 0 ? <PostToc headings={toc} /> : null}

          <div className={styles.prose} data-prose="" lang={post.lang}>
            <div dangerouslySetInnerHTML={{ __html: html }} />

            {post.sources && post.sources.length > 0 ? (
              <section className={styles.sources} aria-labelledby="sources-title">
                <h2 id="sources-title">তথ্যসূত্র</h2>
                <ol>
                  {post.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} rel="noopener nofollow" target="_blank">
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>

          <aside className={styles.aside} lang="bn">
            <div className={styles.asideBlock}>
              <h2>লেখার আকার</h2>
              <div className={styles.sizes} role="group" aria-label="লেখার আকার">
                <button type="button" data-size="sm" aria-label="ছোট লেখা">
                  অ
                </button>
                <button type="button" data-size="md" aria-label="স্বাভাবিক লেখা" aria-pressed="true">
                  অ
                </button>
                <button type="button" data-size="lg" aria-label="বড় লেখা">
                  অ
                </button>
              </div>
            </div>
            <div className={styles.asideBlock}>
              <h2>শেয়ার করুন</h2>
              <ul className={styles.share}>
                <li>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <Icon name="facebook" size={18} />
                    ফেসবুক
                  </a>
                </li>
                <li>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`} target="_blank" rel="noopener">
                    <Icon name="whatsapp" size={18} />
                    হোয়াটসঅ্যাপ
                  </a>
                </li>
                <li>
                  <button type="button" data-copy={url}>
                    <Icon name="link" size={18} />
                    <span>লিংক কপি</span>
                  </button>
                </li>
                <li>
                  <button type="button" data-print="">
                    <Icon name="printer" size={18} />
                    প্রিন্ট
                  </button>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <footer className={`container ${styles.postFoot}`} lang="bn">
          <section className={styles.authorBox} aria-labelledby="author-box-title">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/site/author.webp" alt="" width="96" height="96" loading="lazy" />
            <div>
              <span className="overline">লেখক</span>
              <h2 id="author-box-title">{SITE.name}</h2>
              <p>
                নব্বইয়ের দশকে বেড়ে ওঠা একজন অনুশীলনকারী মুসলিম। পরিবার, সন্তান প্রতিপালন ও সমকালীন সমাজ নিয়ে লেখেন এবং
                পারিবারিক পরামর্শ দেন।
              </p>
              <Link className={styles.more} href="/about/">
                লেখক সম্পর্কে আরও <Icon name="arrow-right" />
              </Link>
            </div>
          </section>

          <nav className={styles.postNav} aria-label="আরও লেখা">
            {older ? (
              <Link className={styles.prev} href={`/posts/${older.slug}/`} rel="prev">
                <small>
                  <Icon name="chevron-left" size={16} />
                  আগের লেখা
                </small>
                <span lang={older.lang}>{older.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link className={styles.next} href={`/posts/${newer.slug}/`} rel="next">
                <small>
                  পরের লেখা
                  <Icon name="chevron-right" size={16} />
                </small>
                <span lang={newer.lang}>{newer.title}</span>
              </Link>
            ) : null}
          </nav>
        </footer>
      </article>

      <section className={`section section--tint ${styles.morePosts}`} aria-labelledby="more-title" lang="bn">
        <div className="container">
          <div className="section-head">
            <h2 id="more-title">আরও পড়ুন</h2>
            <Link className="btn btn--outline" href="/posts/">
              সব লেখা দেখুন <Icon name="arrow-right" />
            </Link>
          </div>
          <div className="post-grid">
            {related.map((item) => (
              <PostCard post={item} key={item.id} />
            ))}
          </div>
        </div>
      </section>

      <div lang="bn">
        <CtaBand
          title="কোনো বিষয়ে পরামর্শ প্রয়োজন?"
          text="আপনার পরিবারের পরিস্থিতি নিয়ে একান্তে কথা বলতে একটি সেশন বুক করুন।"
        />
      </div>

      <PostInteractions />
    </>
  );
}
