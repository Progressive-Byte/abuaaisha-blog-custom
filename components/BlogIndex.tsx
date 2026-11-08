"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Pagination } from "./Pagination";
import { PostCard } from "./PostCard";
import { CATEGORIES, type Category } from "@/lib/post-schema";
import { CATEGORY_META } from "@/lib/site";
import type { ListingPage } from "@/lib/listing";
import type { Post } from "@/lib/types";
import styles from "./BlogIndex.module.css";

interface Props extends ListingPage {
  category?: Category;
}

interface SearchResult {
  url: string;
  title: string;
  excerpt: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>,
      )}
    </>
  );
}

export function BlogIndex({ posts, current, total, sort, category }: Props) {
  const router = useRouter();
  const base = category ? `/categories/${category}/` : "/posts/";
  const sortBase = sort === "old" ? `${base}oldest/` : base;

  const tabs = [
    { href: "/posts/", label: "সব লেখা", icon: "grid", active: !category },
    ...CATEGORIES.map((c) => ({
      href: `/categories/${c}/`,
      label: CATEGORY_META[c].label,
      icon: CATEGORY_META[c].icon,
      active: c === category,
    })),
  ];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const onClick = (event: MouseEvent) => {
      if (!form.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setOpen(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        const body = (await response.json().catch(() => ({ results: [] }))) as { results?: SearchResult[] };
        setResults(body.results ?? []);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function onSort(value: string) {
    if (value !== sortBase) router.push(value);
  }

  return (
    <>
      <div className={styles.toolbar}>
        <nav className={styles.tabs} aria-label="বিভাগ">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tab} ${tab.active ? styles.active : ""}`}
              aria-current={tab.active ? "page" : undefined}
            >
              <Icon name={tab.icon} size={18} />
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className={styles.tools}>
          <form
            className={styles.search}
            role="search"
            ref={formRef}
            onSubmit={(event) => {
              event.preventDefault();
              setOpen(true);
            }}
          >
            <label className="visually-hidden" htmlFor="post-search">
              লেখা খুঁজুন
            </label>
            <Icon name="search" size={20} />
            <input
              id="post-search"
              type="search"
              name="q"
              placeholder="লেখার শিরোনাম দিয়ে খুঁজুন"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-controls="post-search-results"
            />
            <div
              id="post-search-results"
              className={styles.results}
              hidden={!open || query.trim().length < 2 || (!searching && results.length === 0)}
            >
              {results.length > 0 ? (
                <ul>
                  {results.map((result) => (
                    <li key={result.url}>
                      <Link href={result.url}>
                        <strong>
                          <Highlight text={result.title} query={query} />
                        </strong>
                        <span>
                          <Highlight text={result.excerpt} query={query} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{searching ? "খোঁজা হচ্ছে…" : "কোনো লেখা পাওয়া যায়নি।"}</p>
              )}
            </div>
          </form>

          <div className={styles.sort}>
            <Icon name="sort" size={18} />
            <label htmlFor="post-sort">সাজান:</label>
            <select
              id="post-sort"
              value={sortBase}
              onChange={(event) => onSort(event.target.value)}
              aria-label="সাজানোর ক্রম"
            >
              <option value={base}>নতুন আগে</option>
              <option value={`${base}oldest/`}>পুরোনো আগে</option>
            </select>
            <Icon name="chevron-down" size={18} className={styles.chevron} />
          </div>
        </div>
      </div>

      <div className="post-grid">
        {posts.map((post: Post, index) => (
          <PostCard post={post} headingLevel={2} eager={index < 3} key={post.id} />
        ))}
      </div>

      <Pagination current={current} total={total} base={sortBase} />
    </>
  );
}
