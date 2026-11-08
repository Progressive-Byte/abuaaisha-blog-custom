import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import styles from "./thanks.module.css";

export const metadata: Metadata = {
  title: "বার্তা পাঠানো হয়েছে",
  robots: { index: false, follow: false },
};

export default function ThanksPage() {
  return (
    <section className={`container ${styles.thanks}`}>
      <span className={styles.badge}>
        <Icon name="check-circle" size={32} />
      </span>
      <h1>জাযাকাল্লাহু খাইরান!</h1>
      <p>আপনার বার্তা পৌঁছেছে। সাধারণত ২৪ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।</p>
      <div className={styles.actions}>
        <Link className="btn btn--primary" href="/posts/">
          লেখাগুলো পড়ুন <Icon name="arrow-right" />
        </Link>
        <Link className="btn btn--outline" href="/">
          হোমে ফিরে যান
        </Link>
      </div>
    </section>
  );
}
