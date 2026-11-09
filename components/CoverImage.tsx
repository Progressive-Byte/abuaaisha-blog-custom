"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./CoverImage.module.css";

interface Props {
  src?: string;
  alt?: string;
  sizes: string;
  eager?: boolean;
  className?: string;
  fallbackSrc: string;
  width?: number;
  height?: number;
}

export function CoverImage({
  src,
  alt = "",
  sizes,
  eager = false,
  className,
  fallbackSrc,
  width = 1170,
  height = 785,
}: Props) {
  const [current, setCurrent] = useState(src ?? fallbackSrc);
  const [loaded, setLoaded] = useState(false);

  function handleError() {
    if (current !== fallbackSrc) {
      setCurrent(fallbackSrc);
      setLoaded(false);
      return;
    }
    setLoaded(true);
  }

  return (
    <span className={`${styles.frame} ${className ?? ""} ${loaded ? styles.loaded : ""}`}>
      <Image
        src={current}
        alt={src ? alt : ""}
        width={width}
        height={height}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        priority={eager}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={styles.image}
      />
    </span>
  );
}
