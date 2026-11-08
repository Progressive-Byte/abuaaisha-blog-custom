import Link from "next/link";
import { Icon } from "./Icon";
import { CATEGORY_META } from "@/lib/site";
import type { Category } from "@/lib/post-schema";
import styles from "./CategoryBadge.module.css";

export function CategoryBadge({ category, link = false }: { category: Category; link?: boolean }) {
  const meta = CATEGORY_META[category];
  const content = (
    <>
      <Icon name={meta.icon} size={16} />
      {meta.label}
    </>
  );

  if (link) {
    return (
      <Link className={styles.badge} href={`/categories/${category}/`}>
        {content}
      </Link>
    );
  }

  return <span className={styles.badge}>{content}</span>;
}
