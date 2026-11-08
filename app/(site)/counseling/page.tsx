import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/Icon";
import { ScrollToSessions } from "@/components/ScrollToSessions";
import { SITE } from "@/lib/site";
import styles from "./counseling.module.css";

export const metadata: Metadata = {
  title: "ইসলামিক কাউন্সেলিং",
  description: "দাম্পত্য, প্যারেন্টিং ও ব্যক্তিগত দুশ্চিন্তায় কোরআন-সুন্নাহর আলোকে আন্তরিক পরামর্শ—অনলাইনে বা সরাসরি।",
  alternates: { canonical: "/counseling/" },
  openGraph: { images: [{ url: "/images/site/counseling-hero.webp" }] },
};

const topics = [
  { icon: "rings", label: "দাম্পত্য সম্পর্ক" },
  { icon: "family", label: "প্যারেন্টিং" },
  { icon: "phone", label: "স্ক্রিন আসক্তি" },
  { icon: "heart", label: "বিবাহপূর্ব পরামর্শ" },
  { icon: "shield", label: "পারিবারিক বিরোধ" },
  { icon: "chat", label: "ব্যক্তিগত দুশ্চিন্তা" },
];

const sessions = [
  {
    name: "সংক্ষিপ্ত সেশন",
    mode: { icon: "video", label: "অনলাইন" },
    duration: "৩০ মিনিট",
    price: "৳১,৫০০",
    features: ["একটি নির্দিষ্ট বিষয়ে পরামর্শ", "ভিডিও বা অডিও কলে"],
    subject: "সেশন বুকিং: সংক্ষিপ্ত সেশন",
    featured: false,
  },
  {
    name: "পূর্ণাঙ্গ সেশন",
    mode: { icon: "video", label: "অনলাইন" },
    duration: "৬০ মিনিট",
    price: "৳২,৫০০",
    features: ["বিস্তারিত আলোচনা", "দম্পতি একসাথে অংশ নিতে পারবেন"],
    subject: "সেশন বুকিং: পূর্ণাঙ্গ সেশন",
    featured: true,
  },
  {
    name: "সরাসরি সাক্ষাৎ",
    mode: { icon: "map-pin", label: "সরাসরি" },
    duration: "৬০ মিনিট",
    price: "৳৩,৫০০",
    features: ["মুখোমুখি আলোচনা", "পারিবারিক সেশনের সুযোগ"],
    subject: "সেশন বুকিং: সরাসরি সাক্ষাৎ",
    featured: false,
  },
];

const steps = [
  { title: "সেশন বেছে নিন", text: "প্রয়োজন অনুযায়ী" },
  { title: "সময় ও ফি নিশ্চিত করুন", text: "অনলাইনে পেমেন্ট" },
  { title: "নির্ধারিত সময়ে কথা বলুন", text: "ভিডিও কল বা সাক্ষাতে" },
];

const channels = [
  { icon: "mail", label: "ইমেইল", value: SITE.email, href: `mailto:${SITE.email}` },
  { icon: "chat", label: "কাউন্সেলিং", value: "সেশন বুক করুন", href: "/contact/", modal: true },
];

export default function CounselingPage() {
  return (
    <>
      <Suspense fallback={null}>
        <ScrollToSessions />
      </Suspense>
      <section className={styles.hero} aria-labelledby="counseling-title">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.heroBg}
          src="/images/site/counseling-hero.webp"
          alt=""
          width="1584"
          height="672"
          fetchPriority="high"
        />
        <div className={`container ${styles.heroCopy}`}>
          <span className="overline overline--glass">
            <Icon name="star" />
            ইসলামিক কাউন্সেলিং
          </span>
          <h1 id="counseling-title">পারিবারিক জীবনের জটিলতায় আন্তরিক পরামর্শ</h1>
          <p>কোরআন-সুন্নাহর আলোকে, ধৈর্য নিয়ে আপনার কথা শোনা হবে।</p>
          <a className="btn btn--light" href="#sessions">
            সেশন বুক করুন <Icon name="arrow-right" />
          </a>
        </div>
      </section>

      <section className="section" aria-labelledby="topics-title">
        <div className="container">
          <div className="section-head section-head--center">
            <h2 id="topics-title">যেসব বিষয়ে পরামর্শ দেওয়া হয়</h2>
          </div>
          <ul className={styles.topics}>
            {topics.map((topic) => (
              <li key={topic.label}>
                <span className={styles.topicIcon}>
                  <Icon name={topic.icon} size={29} />
                </span>
                {topic.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tint" id="sessions" aria-labelledby="sessions-title">
        <div className="container">
          <div className="section-head section-head--center">
            <h2 id="sessions-title">সেশন বেছে নিন</h2>
            <p>অনলাইনে বা সরাসরি—আপনার সুবিধামতো</p>
          </div>
          <div className={styles.sessions}>
            {sessions.map((session) => (
              <article className={`${styles.session} ${session.featured ? styles.featured : ""}`} key={session.name}>
                <div className={styles.sessionTop}>
                  <h3>{session.name}</h3>
                  {session.featured ? <span className={styles.popular}>জনপ্রিয়</span> : null}
                </div>
                <p className="meta-row">
                  <span>
                    <Icon name={session.mode.icon} size={20} />
                    {session.mode.label}
                  </span>
                  <span>
                    <Icon name="clock" size={20} />
                    {session.duration}
                  </span>
                </p>
                <p className={styles.price}>
                  <strong>{session.price}</strong> <span>/ সেশন</span>
                </p>
                <ul className="checklist">
                  {session.features.map((feature) => (
                    <li key={feature}>
                      <Icon name="check-circle" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  className={`btn btn--block ${session.featured ? "btn--light" : "btn--outline"}`}
                  href="/contact/"
                  data-contact-open=""
                  data-subject={session.subject}
                >
                  সেশন বুক করুন <Icon name="arrow-right" />
                </Link>
              </article>
            ))}
          </div>
          <p className={styles.note}>
            <Icon name="lock" size={20} />
            সব সেশন সম্পূর্ণ গোপনীয় এবং রেকর্ড করা হয় না
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="steps-title">
        <div className="container">
          <div className="section-head section-head--center">
            <h2 id="steps-title">যেভাবে বুক করবেন</h2>
          </div>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.num}>{["১", "২", "৩"][index]}</span>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
          <div className={styles.center}>
            <a className="btn btn--primary" href="#sessions">
              সেশন বুক করুন <Icon name="arrow-right" />
            </a>
          </div>
        </div>
      </section>

      <section className={styles.contactSection} aria-labelledby="contact-title">
        <div className="container">
          <div className={styles.contactCard}>
            <h2 id="contact-title">প্রশ্ন আছে? সরাসরি যোগাযোগ করুন</h2>
            <ul className={styles.channels}>
              {channels.map((channel) => (
                <li key={channel.label}>
                  <a
                    href={channel.href}
                    data-contact-open={channel.modal ? "" : undefined}
                    target={channel.href.startsWith("https") ? "_blank" : undefined}
                    rel={channel.href.startsWith("https") ? "me noopener" : undefined}
                  >
                    <span className={styles.chIcon}>
                      <Icon name={channel.icon} size={20} />
                    </span>
                    <span className={styles.chText}>
                      <small>{channel.label}</small>
                      <strong>{channel.value}</strong>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
