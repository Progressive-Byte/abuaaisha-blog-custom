import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "পাতাটি পাওয়া যায়নি",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className={`lattice-band ${styles.missing}`}>
      <div className="container">
        <p className={styles.code}>৪০৪</p>
        <h1>দুঃখিত, পাতাটি পাওয়া যায়নি</h1>
        <p>লিংকটি হয়তো ভুল, অথবা পাতাটি সরিয়ে নেওয়া হয়েছে।</p>
        <div className={styles.actions}>
          <Link className="btn btn--light" href="/posts/">
            সব লেখা দেখুন <Icon name="arrow-right" />
          </Link>
          <Link className="btn btn--ghost-light" href="/">
            হোমে ফিরে যান
          </Link>
        </div>
      </div>
    </section>
  );
}
