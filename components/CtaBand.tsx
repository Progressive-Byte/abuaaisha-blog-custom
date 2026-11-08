import Link from "next/link";
import { Icon } from "./Icon";
import styles from "./CtaBand.module.css";

export function CtaBand({ title, text }: { title: string; text: string }) {
  return (
    <section className={`${styles.ctaBand} container`} aria-labelledby="cta-title">
      <div className={styles.inner}>
        <span className={styles.dot} aria-hidden="true" />
        <div className={styles.copy}>
          <h2 id="cta-title">{title}</h2>
          <p>{text}</p>
        </div>
        <Link className="btn btn--light" href="/counseling/#sessions">
          সেশন বুক করুন <Icon name="arrow-right" />
        </Link>
      </div>
    </section>
  );
}
