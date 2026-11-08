import type { Metadata } from "next";
import Link from "next/link";
import { ArchFrame } from "@/components/ArchFrame";
import { Icon } from "@/components/Icon";
import { PostCard } from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";
import { SITE, SITE_URL } from "@/lib/site";
import styles from "./page.module.css";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const counselingTopics = [
  "দাম্পত্য ও পারিবারিক সম্পর্ক",
  "সন্তান প্রতিপালন ও প্যারেন্টিং",
  "স্ক্রিন আসক্তি ও তরুণদের মানসিক চাপ",
  "দ্বীনি জীবনযাপনে দিকনির্দেশনা",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.nameEn,
  alternateName: SITE.name,
  url: SITE_URL,
  inLanguage: "bn",
};

export default async function HomePage() {
  const recent = (await getPublishedPosts()).slice(0, 6);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className={`${styles.hero} lattice-band`} aria-labelledby="hero-title">
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.intro}>
            <span className="overline overline--glass">
              <span className={styles.goldDot} />
              {SITE.name} · {SITE.tagline}
            </span>
            <h1 id="hero-title">সমকালীন পৃথিবীর মুসলিম জীবনের প্রশ্ন, আর সমস্যার উত্তরের খোঁজে</h1>
            <p className={styles.lede}>
              পরিবার, সন্তান প্রতিপালন, সমাজ আর দ্বীনের পথে অবিচল থাকার চ্যালেঞ্জ নিয়ে ব্যক্তিগত অভিজ্ঞতা থেকে লেখা—আর
              প্রয়োজনে আন্তরিক পরামর্শ।
            </p>
            <div className={styles.actions}>
              <Link className="btn btn--light" href="/counseling/?scroll=sessions">
                কাউন্সেলিং <Icon name="arrow-right" />
              </Link>
              <Link className="btn btn--ghost-light" href="/posts/">
                লেখাগুলো পড়ুন
              </Link>
            </div>
            <ul className={styles.contact}>
              <li>
                <span className={styles.glassIcon}>
                  <Icon name="mail" size={20} />
                </span>
                <span>
                  <small>ইমেইল করুন</small>
                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                </span>
              </li>
              
            </ul>
          </div>
          <div className={styles.archWrap}>
            <ArchFrame src="/images/site/hero-desk.webp" alt="জানালার পাশে রেহালে রাখা কুরআন, খোলা খাতা আর কলম" />
          </div>
        </div>
      </section>

      <section className={`section ${styles.author}`} aria-labelledby="author-title">
        <div className={`container ${styles.split}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.authorPhoto}
            src="/images/site/author-village.webp"
            alt="সন্ধ্যার আলোয় পুরোনো বাড়ির সামনে মাঠে ফুটবল খেলছে শিশুরা"
            width="928"
            height="1152"
            loading="lazy"
            decoding="async"
          />
          <div className={styles.authorCopy}>
            <span className="overline">লেখক পরিচিতি</span>
            <h2 id="author-title">সালাফদের পথ অনুসরণ করে দ্বীন পালনের চেষ্টায় একজন মুসলিম</h2>
            <p>
              নব্বইয়ের দশকে বেড়ে ওঠা আমি সেই সময়ের জীবনকে গভীরভাবে লালন করি—যে জীবন ছিল সামাজিক মেলামেশায় ভরপুর,
              প্রতিবেশী ও আত্মীয়স্বজনের মধ্যে ছিল সত্যিকারের আন্তরিক সম্পর্ক।
            </p>
            <blockquote>
              আমার লেখাগুলোর মূল লক্ষ্য—আজকের পৃথিবীতে মুসলিমরা যেসব চ্যালেঞ্জের মুখোমুখি, সেগুলো চিহ্নিত করা এবং সম্ভাব্য
              সমাধান তুলে ধরা।
            </blockquote>
            <Link className="btn btn--primary" href="/about/">
              পুরো পরিচিতি পড়ুন <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="recent-title">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="overline">ব্লগ</span>
              <h2 id="recent-title">সাম্প্রতিক লেখা</h2>
              <p>দ্বীন, পরিবার আর সমকালীন সমাজ নিয়ে নতুন লেখাগুলো</p>
            </div>
            <Link className="btn btn--outline" href="/posts/">
              সব লেখা দেখুন <Icon name="arrow-right" />
            </Link>
          </div>
          <div className="post-grid">
            {recent.map((post) => (
              <PostCard post={post} key={post.id} />
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.counseling}`} aria-labelledby="counseling-title">
        <div className={`container ${styles.split} ${styles.splitReverse}`}>
          <div className={styles.counselingCopy}>
            <span className="overline">ইসলামিক কাউন্সেলিং</span>
            <h2 id="counseling-title">পারিবারিক ও ব্যক্তিগত জীবনের প্রশ্নে আন্তরিক পরামর্শ</h2>
            <p>
              দাম্পত্য, সন্তান প্রতিপালন কিংবা ব্যক্তিগত দুশ্চিন্তা—কোরআন-সুন্নাহর আলোকে ও বাস্তব অভিজ্ঞতা থেকে ধৈর্য নিয়ে
              আপনার কথা শোনা হবে এবং করণীয় নিয়ে পরামর্শ দেওয়া হবে।
            </p>
            <ul className="checklist">
              {counselingTopics.map((topic) => (
                <li key={topic}>
                  <Icon name="check-circle" />
                  {topic}
                </li>
              ))}
            </ul>
            <p className="meta-row">
              <span>
                <Icon name="video" />
                অনলাইন ও সরাসরি সেশন
              </span>
              <span>
                <Icon name="lock" />
                সম্পূর্ণ গোপনীয়
              </span>
            </p>
            <div className={styles.actions}>
              <Link className="btn btn--primary" href="/counseling/?scroll=sessions">
                সেশন বুক করুন <Icon name="arrow-right" />
              </Link>
              <Link className="btn btn--outline" href="/counseling/">
                বিস্তারিত দেখুন
              </Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.counselingPhoto}
            src="/images/site/counseling.webp"
            alt="ঘরোয়া পরিবেশে একজন কাউন্সেলরের সাথে কথা বলছেন এক দম্পতি"
            width="1264"
            height="848"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>
    </>
  );
}
