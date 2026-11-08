"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

  const isActive = (href: string, exact: boolean) => {
    const clean = pathname.endsWith("/") ? pathname : `${pathname}/`;
    if (exact) return clean === href;
    return clean === href || clean.startsWith(href);
  };

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login/");
      router.refresh();
    }
  }

  return (
    <aside className="a-sidebar">
      <Link className="a-brand" href="/admin/">
        <span className="a-brand-mark">
          <Icon name="star" size={18} />
        </span>
        <span>
          <strong>Abu Aaisha</strong>
          <small>Admin</small>
        </span>
      </Link>

      <nav className="a-nav" aria-label="Admin">
        {links.map((link) => (
          <Link key={link.href} href={link.href} aria-current={isActive(link.href, link.exact) ? "page" : undefined}>
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
        <p className="a-nav-email">{email}</p>
      </div>
    </aside>
  );
}
