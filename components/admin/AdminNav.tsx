"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api-client";

const links = [
  { href: "/admin/", label: "Dashboard", icon: "grid", exact: true },
  { href: "/admin/posts/", label: "All posts", icon: "book", exact: false },
  { href: "/admin/posts/new/", label: "New post", icon: "pen", exact: true },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname() ?? "/admin/";
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact: boolean) => {
    const clean = pathname.endsWith("/") ? pathname : `${pathname}/`;
    if (exact) return clean === href;
    if (href === "/admin/posts/" && clean.startsWith("/admin/posts/new/")) return false;
    return clean === href || clean.startsWith(href);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".a-sidebar")) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login/");
      router.refresh();
    }
  }

  return (
    <aside className="a-sidebar" data-open={open ? "true" : "false"}>
      <div className="a-topbar">
        <Link className="a-brand" href="/admin/" onClick={() => setOpen(false)}>
          <span className="a-brand-mark">
            <Icon name="star" size={18} />
          </span>
          <span className="a-brand-text">
            <strong>Abu Aaisha</strong>
            <small>Admin</small>
          </span>
        </Link>

        <button
          className="a-menu-btn"
          type="button"
          data-admin-menu
          aria-expanded={open}
          aria-controls="admin-nav-panel"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? "close" : "menu"} size={22} />
        </button>
      </div>

      <div className="a-nav-panel" id="admin-nav-panel">
        <nav className="a-nav" aria-label="Admin">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href, link.exact) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon name={link.icon} size={18} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="a-nav-foot">
          <Link href="/" target="_blank" rel="noreferrer">
            <Icon name="arrow-up-right" size={18} />
            View site
          </Link>
          <button type="button" onClick={logout}>
            <Icon name="lock" size={18} />
            Sign out
          </button>
          <p className="a-nav-email" title={email}>
            {email}
          </p>
        </div>
      </div>
    </aside>
  );
}
