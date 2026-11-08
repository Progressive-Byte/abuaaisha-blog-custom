import type { Metadata } from "next";
import Link from "next/link";
import { ArchFrame } from "@/components/ArchFrame";
import { Icon } from "@/components/Icon";
import { getAboutPage } from "@/lib/about";
import { CATEGORIES } from "@/lib/post-schema";
import { CATEGORY_META, SITE } from "@/lib/site";
import styles from "./about.module.css";

const highlights = [
  { icon: "history", text: "নব্বইয়ের দশকে বেড়ে ওঠা" },
  { icon: "book", text: "সালাফদের পথ অনুসরণের চেষ্টা" },
  { icon: "pen", text: "মুসলিমদের চ্যালেঞ্জ ও সমাধান নিয়ে লেখা" },
];

const topicImages = {
  faith: { src: "/images/site/topic-faith.webp", alt: "মসজিদে কাতারবন্দি হয়ে সালাত আদায় করছেন মুসল্লিরা" },
  social: { src: "/images/site/topic-social.webp", alt: "ঘরে বসে আলাপ করছেন দুইজন নারী" },
  worldview: { src: "/images/site/topic-worldview.webp", alt: "সন্ধ্যার আকাশের নিচে শহরের দৃশ্য, দূরে মিনার" },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage();
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: "/about/" },
  };
}

export default async function AboutPage() {
  const page = await getAboutPage();

  return (
    <>
      <section className={`${styles.hero} lattice-band`} aria-labelledby="about-title">
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.intro}>
            <span className="overline overline--glass">
              <span className={styles.goldDot} />
              পরিচিতি
            </span>
            <h1 id="about-title">{SITE.name}</h1>
            <p className={styles.role}>লেখক ও ইসলামিক কাউন্সেলর</p>
            <p className={styles.lede}>{page.description}</p>
            <div className={styles.actions}>
              <Link className="btn btn--light" href="/counseling/#sessions">
                সেশন বুক করুন <Icon name="arrow-right" />
              </Link>
              <Link className="btn btn--ghost-light" href="/posts/">
                লেখাগুলো পড়ুন
              </Link>
            </div>
          </div>
          <div className={styles.archWrap}>
            <ArchFrame src="/images/site/about-arch.webp" alt="সন্ধ্যার আলোয় পুরোনো বাড়ির সামনে মাঠে ফুটবল খেলছে শিশুরা" />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="story-title">
        <div className={`container ${styles.story}`}>
          <div className={styles.storyHead}>
            <span className="overline">আমার গল্প</span>
            <h2 id="story-title">সালাফদের পথ, নব্বইয়ের স্মৃতি আর আজকের প্রশ্ন</h2>
            <div className={styles.ornament} aria-hidden="true">
              <span />
              <Icon name="star" size={12} />
              <span />
            </div>
            <ul>
              {highlights.map((highlight) => (
                <li key={highlight.text}>
                  <span className={styles.hlIcon}>
                    <Icon name={highlight.icon} size={18} />
                  </span>
                  {highlight.text}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.storyBody} dangerouslySetInnerHTML={{ __html: page.html }} />
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="topics-title">
        <div className="container">
          <div className="section-head">
            <h2 id="topics-title">যে বিষয়গুলো নিয়ে লিখি</h2>
            <Link className="btn btn--outline" href="/posts/">
              সব লেখা দেখুন <Icon name="arrow-right" />
            </Link>
          </div>
          <div className={styles.topics}>
            {CATEGORIES.map((category) => (
              <a className={styles.topic} href={`/categories/${category}/`} key={category}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={topicImages[category].src}
                  alt={topicImages[category].alt}
                  width="1264"
                  height="848"
                  loading="lazy"
                  decoding="async"
                />
                <span className={styles.topicBody}>
                  <span className={styles.topicIcon}>
                    <Icon name={CATEGORY_META[category].icon} size={20} />
                  </span>
                  <strong>{CATEGORY_META[category].label}</strong>
                  <span>{CATEGORY_META[category].blurb}</span>
                  <span className={styles.topicLink}>
                    লেখাগুলো দেখুন <Icon name="arrow-right" />
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-label="পরবর্তী পদক্ষেপ">
        <div className={`container ${styles.ctas}`}>
          <div className={`${styles.cta} ${styles.ctaLight}`}>
            <Icon name="pen" size={20} className={styles.ctaIcon} />
            <h2>লেখাগুলো পড়ুন</h2>
            <p>দ্বীন, পরিবার আর সমকালীন সমাজ নিয়ে সব লেখা এক জায়গায়।</p>
            <Link className="btn btn--primary" href="/posts/">
              ব্লগ দেখুন <Icon name="arrow-right" />
            </Link>
          </div>
          <div className={`${styles.cta} ${styles.ctaDark}`}>
            <Icon name="chat" size={20} className={styles.ctaIcon} />
            <h2>পরামর্শ প্রয়োজন?</h2>
            <p>পারিবারিক বা ব্যক্তিগত বিষয়ে একান্তে কথা বলতে সেশন বুক করুন।</p>
            <Link className="btn btn--light" href="/counseling/#sessions">
              সেশন বুক করুন <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
