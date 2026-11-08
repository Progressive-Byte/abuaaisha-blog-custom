"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { NAV } from "@/lib/site";
import styles from "./Header.module.css";

function isActive(path: string, href: string): boolean {
  return href === "/" ? path === "/" : path.startsWith(href) || (href === "/posts/" && path.startsWith("/categories/"));
}

export function Header() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.toggle("menu-open", true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("menu-open");
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.bar}>
          <Logo />

          <button
            className={styles.toggle}
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="visually-hidden">মেনু</span>
            <span className={styles.burger} aria-hidden="true" />
          </button>

          <div id="site-menu" className={`${styles.menu} ${open ? styles.open : ""}`}>
            <nav aria-label="প্রধান মেনু" onClick={() => setOpen(false)}>
              <ul>
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <span className={styles.divider} aria-hidden="true" />
            <div className={styles.actions} onClick={() => setOpen(false)}>
              <Link className={`btn btn--outline ${styles.contactBtn}`} href="/contact/" data-contact-open="">
                <Icon name="mail" size={20} />
                যোগাযোগ করুন
              </Link>
              <Link className="btn btn--primary" href="/counseling/#sessions">
                সেশন বুক করুন
                <Icon name="arrow-right" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
