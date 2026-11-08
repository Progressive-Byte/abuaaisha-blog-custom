import Link from "next/link";
import { Icon } from "./Icon";
import { SITE } from "@/lib/site";
import styles from "./Logo.module.css";

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link className={`${styles.logo} ${tone === "dark" ? styles.dark : ""}`} href="/" aria-label={`${SITE.name} — হোম`}>
      <span className={styles.mark}>
        <Icon name="star" size={20} />
      </span>
      <span className={styles.wordmark}>
        <span className={styles.name}>{SITE.name}</span>
        <span className={styles.tagline}>{SITE.tagline}</span>
      </span>
    </Link>
  );
}
