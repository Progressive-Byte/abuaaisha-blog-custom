"use client";

import { useEffect, useState } from "react";
import styles from "./PostArticle.module.css";

export interface TocHeading {
  id: string;
  text: string;
}

interface Props {
  headings: TocHeading[];
  title?: string;
}

export function PostToc({ headings, title = "এই লেখায় যা আছে" }: Props) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);
  const ids = headings.map((heading) => heading.id).join("|");

  useEffect(() => {
    const elements = ids
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const bottomReached =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;

      if (bottomReached) {
        setActiveId(elements[elements.length - 1].id);
        return;
      }

      const offset = 140;
      let current = elements[0].id;
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= offset) current = element.id;
        else break;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return (
    <nav className={styles.postToc} aria-labelledby="toc-title" lang="bn">
      <h2 id="toc-title">{title}</h2>
      <ol>
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? "location" : undefined}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
