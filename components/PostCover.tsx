import Image from "next/image";
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
    <Image
      className={`${styles.cover} ${className ?? ""}`}
      src={src ?? SITE.postPlaceholder}
      alt={src ? (alt ?? "") : ""}
      width={1170}
      height={785}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      priority={eager}
    />
  );
}
