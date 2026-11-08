import Link from "next/link";
import { CategoryBadge } from "./CategoryBadge";
import { Icon } from "./Icon";
import { PostCover } from "./PostCover";
import { formatDualDate, formatIsoDate, readingTimeLabel } from "@/lib/format";
import type { Post } from "@/lib/types";
import styles from "./PostCard.module.css";

interface Props {
  post: Post;
  headingLevel?: 2 | 3;
  eager?: boolean;
}

export function PostCard({ post, headingLevel = 3, eager = false }: Props) {
  const { title, summary, publishedAt, categories, image, lang } = post;
  const href = `/posts/${post.slug}/`;
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article className={styles.card} lang={lang}>
      <PostCover src={image?.url} alt={image?.alt} category={categories[0]} eager={eager} />
      <div className={styles.body}>
        <div className={styles.metaTop}>
          <CategoryBadge category={categories[0]} />
          <span className={styles.read}>
            <Icon name="clock" size={16} />
            {readingTimeLabel(post.body)}
          </span>
        </div>
        <Heading className={styles.title}>
          <Link href={href}>{title}</Link>
        </Heading>
        <p className={styles.summary}>{summary}</p>
        <p className={styles.date}>
          <Icon name="calendar" size={16} />
          <time dateTime={formatIsoDate(publishedAt)}>{formatDualDate(publishedAt)}</time>
        </p>
      </div>
    </article>
  );
}
