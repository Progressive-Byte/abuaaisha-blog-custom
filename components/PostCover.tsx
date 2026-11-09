import { CoverImage } from "./CoverImage";
import { SITE } from "@/lib/site";
import styles from "./PostCover.module.css";

interface Props {
  src?: string;
  alt?: string;
  sizes?: string;
  eager?: boolean;
  className?: string;
}

export function PostCover({
  src,
  alt = "",
  sizes = "(min-width: 64rem) 400px, 100vw",
  eager = false,
  className,
}: Props) {
  return (
    <CoverImage
      src={src}
      alt={alt}
      sizes={sizes}
      eager={eager}
      fallbackSrc={SITE.postPlaceholder}
      className={`${styles.cover} ${className ?? ""}`}
    />
  );
}
