"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";
import type { StatsResponse } from "@/lib/admin-types";
import { CATEGORY_META } from "@/lib/site";
import { formatDate } from "@/lib/format";

export function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api<StatsResponse>("/admin/stats")
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="a-stack">
      <header className="a-page-head">
        <div>
          <h1 className="a-title">Dashboard</h1>
          <p className="a-subtitle">An overview of your blog.</p>
        </div>
        <div className="a-row">
          <Link className="a-btn a-btn-outline" href="/admin/posts/">
            <Icon name="book" size={16} />
            All posts
          </Link>
          <Link className="a-btn" href="/admin/posts/new/">
            <Icon name="pen" size={16} />
            New post
          </Link>
        </div>
      </header>

      {error ? (
        <p className="a-banner a-banner-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="a-stats">
        <div className="a-stat">
          <span>Total</span>
          <strong>{loading ? "—" : stats?.total ?? 0}</strong>
        </div>
        <div className="a-stat">
          <span>Published</span>
          <strong>{loading ? "—" : stats?.published ?? 0}</strong>
        </div>
        <div className="a-stat">
          <span>Drafts</span>
          <strong>{loading ? "—" : stats?.drafts ?? 0}</strong>
        </div>
      </div>

      <section className="a-card a-stack">
        <div className="a-row" style={{ justifyContent: "space-between" }}>
          <h2 className="a-title" style={{ fontSize: "1.15rem" }}>
            Recently updated
          </h2>
          <Link className="a-btn a-btn-ghost a-btn-sm" href="/admin/posts/">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="a-muted">Loading posts…</p>
        ) : stats && stats.recent.length > 0 ? (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link href={`/admin/posts/${post.id}/edit/`}>{post.title}</Link>
                      <div className="a-muted">{post.slug}</div>
                    </td>
                    <td>
                      <span className={`a-status a-status-${post.status}`}>{post.status}</span>
                    </td>
                    <td>{CATEGORY_META[post.categories[0]].label}</td>
                    <td className="a-muted">{formatDate(new Date(post.updatedAt))}</td>
                    <td>
                      <Link className="a-btn a-btn-outline a-btn-sm" href={`/admin/posts/${post.id}/edit/`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="a-empty">No posts yet. Create your first post.</p>
        )}
      </section>
    </div>
  );
}
