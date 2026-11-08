import styles from "./PageIntro.module.css";

export function PageIntro({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className={styles.intro}>
      <h1>{title}</h1>
      {lede ? <p>{lede}</p> : null}
    </header>
  );
}
