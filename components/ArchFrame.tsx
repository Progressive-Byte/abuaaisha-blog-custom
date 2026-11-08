import styles from "./ArchFrame.module.css";

export function ArchFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className={styles.arch}>
      <svg className={styles.outline} viewBox="0 0 507.38 636.244" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0.69 635.554V267.37C0.69 120.731 152.49 45.1896 253.69 0.753586C354.89 45.1896 506.69 120.731 506.69 267.37V635.554H0.69Z"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg
        className={`${styles.outline} ${styles.outlineInner}`}
        viewBox="0 0 483 611.843"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0.46 611.383V257.073C0.46 115.96 145.084 43.2648 241.5 0.503212C337.916 43.2648 482.54 115.96 482.54 257.073V611.383H0.46Z"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className={styles.photo}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width="552" height="681" fetchPriority="high" decoding="async" />
      </div>
      <svg className={styles.apex} viewBox="0 0 20.24 20.24" aria-hidden="true">
        <path d="M10.12 1.17645L12.7385 3.795H16.445V7.50145L19.0635 10.12L16.445 12.7385V16.445H12.7385L10.12 19.0635L7.50145 16.445H3.795V12.7385L1.17645 10.12L3.795 7.50145V3.795H7.50145L10.12 1.17645Z" />
      </svg>
    </div>
  );
}
