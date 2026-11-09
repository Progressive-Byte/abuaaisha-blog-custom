import styles from "./loading.module.css";

const cards = [0, 1, 2, 3, 4, 5];
const pills = [0, 1, 2, 3];

export default function SiteLoading() {
  return (
    <div className={`container ${styles.page}`} aria-busy="true">
      <div className={styles.progress} aria-hidden="true" />
      <span className="visually-hidden" role="status">
        পাতা লোড হচ্ছে…
      </span>

      <div className={styles.intro}>
        <span className={`${styles.shimmer} ${styles.overline}`} />
        <span className={`${styles.shimmer} ${styles.title}`} />
        <span className={`${styles.shimmer} ${styles.lede}`} />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {pills.map((pill) => (
            <span key={pill} className={`${styles.shimmer} ${styles.pill}`} />
          ))}
        </div>
        <span className={`${styles.shimmer} ${styles.search}`} />
      </div>

      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card} className={styles.card}>
            <span className={`${styles.shimmer} ${styles.media}`} />
            <div className={styles.cardBody}>
              <span className={`${styles.shimmer} ${styles.line} ${styles.lineShort}`} />
              <span className={`${styles.shimmer} ${styles.line} ${styles.lineTitle}`} />
              <span className={`${styles.shimmer} ${styles.line}`} />
              <span className={`${styles.shimmer} ${styles.line} ${styles.lineShort}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
