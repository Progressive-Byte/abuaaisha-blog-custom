import Link from "next/link";
import { Icon } from "./Icon";
import { toBanglaDigits } from "@/lib/format";
import styles from "./Pagination.module.css";

interface Props {
  current: number;
  total: number;
  base: string;
}

export function Pagination({ current, total, base }: Props) {
  const href = (n: number) => (n === 1 ? base : `${base}page/${n}/`);

  const pages: (number | "gap")[] = [];
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || Math.abs(n - current) <= 1) pages.push(n);
    else if (pages.at(-1) !== "gap") pages.push("gap");
  }

  if (total <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="পাতা নির্বাচন">
      {current > 1 ? (
        <Link className={`btn btn--outline ${styles.step}`} href={href(current - 1)} rel="prev">
          <Icon name="arrow-right" className={styles.flip} />
          আগের পাতা
        </Link>
      ) : (
        <span className={`btn btn--outline ${styles.step} ${styles.disabled}`} aria-hidden="true">
          আগের পাতা
        </span>
      )}
      <ol>
        {pages.map((p, index) =>
          p === "gap" ? (
            <li className={styles.gap} aria-hidden="true" key={`gap-${index}`}>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                className={`${styles.num} ${p === current ? styles.active : ""}`}
                href={href(p)}
                aria-current={p === current ? "page" : undefined}
              >
                <span className="visually-hidden">পাতা </span>
                {toBanglaDigits(p)}
              </Link>
            </li>
          ),
        )}
      </ol>
      {current < total ? (
        <Link className={`btn btn--outline ${styles.step}`} href={href(current + 1)} rel="next">
          পরের পাতা
          <Icon name="arrow-right" />
        </Link>
      ) : (
        <span className={`btn btn--outline ${styles.step} ${styles.disabled}`} aria-hidden="true">
          পরের পাতা
        </span>
      )}
    </nav>
  );
}
