import Image from "next/image";
import { Icon } from "./Icon";
import { CATEGORY_META } from "@/lib/site";
import type { Category } from "@/lib/post-schema";
import styles from "./PostCover.module.css";

interface Props {
  src?: string;
  alt?: string;
  category: Category;
  sizes?: string;
  eager?: boolean;
  className?: string;
}

export function PostCover({
  src,
  alt = "",
  category,
  sizes = "(min-width: 64rem) 400px, 100vw",
  eager = false,
  className,
}: Props) {
  if (src) {
    return (
      <Image
        className={`${styles.cover} ${className ?? ""}`}
        src={src}
        alt={alt}
        width={1170}
        height={785}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        priority={eager}
      />
    );
  }

  return (
    <div className={`${styles.cover} ${styles.placeholder} ${className ?? ""}`} role="presentation">
      <span className={styles.glyph}>
        <Icon name={CATEGORY_META[category].icon} size={28} />
      </span>
    </div>
  );
}
