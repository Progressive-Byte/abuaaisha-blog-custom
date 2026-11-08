"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";
import type { StatsResponse } from "@/lib/admin-types";
import { CATEGORY_META } from "@/lib/site";
import { formatAdminDate } from "@/lib/format";

export function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

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
  }, [reload]);

  function retry() {
    setLoading(true);
    setError("");
    setReload((value) => value + 1);
  }

  return (
    <div className="a-stack">
      <header className="a-page-head">
        <div>
          <h1 className="a-title">Dashboard</h1>
          <p className="a-subtitle">An overview of your blog.</p>
        </div>
        <div className="a-page-actions">
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
        <div className="a-banner a-banner-error" role="alert">
          <Icon name="alert-circle" size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button className="a-btn a-btn-outline a-btn-sm" type="button" onClick={retry}>
            <Icon name="history" size={15} />
            Retry
          </button>
        </div>
      ) : null}

      <div className="a-stats" aria-busy={loading}>
        <div className="a-stat">
          <span className="a-stat-icon">
            <Icon name="book" size={20} />
          </span>
          <div>
            <span className="a-stat-label">Total posts</span>
            {loading ? <span className="a-skeleton a-skeleton-value" aria-hidden="true" /> : <strong>{stats?.total ?? 0}</strong>}
          </div>
        </div>
        <div className="a-stat a-stat--published">
          <span className="a-stat-icon">
            <Icon name="check-circle" size={20} />
          </span>
          <div>
            <span className="a-stat-label">Published</span>
            {loading ? (
              <span className="a-skeleton a-skeleton-value" aria-hidden="true" />
            ) : (
              <strong>{stats?.published ?? 0}</strong>
            )}
          </div>
        </div>
        <div className="a-stat a-stat--drafts">
          <span className="a-stat-icon">
            <Icon name="pen" size={20} />
          </span>
          <div>
            <span className="a-stat-label">Drafts</span>
            {loading ? <span className="a-skeleton a-skeleton-value" aria-hidden="true" /> : <strong>{stats?.drafts ?? 0}</strong>}
          </div>
        </div>
      </div>

      <section className="a-card a-stack" aria-busy={loading}>
        <div className="a-card-head">
          <h2 className="a-section-title">Recently updated</h2>
          <Link className="a-btn a-btn-ghost a-btn-sm" href="/admin/posts/">
            View all
          </Link>
        </div>

        {loading ? (
          <div aria-hidden="true">
            <div className="a-skeleton-row">
              <span className="a-skeleton" />
              <span className="a-skeleton" />
            </div>
            <div className="a-skeleton-row">
              <span className="a-skeleton" />
              <span className="a-skeleton" />
            </div>
            <div className="a-skeleton-row">
              <span className="a-skeleton" />
              <span className="a-skeleton" />
            </div>
            <p className="visually-hidden">Loading posts…</p>
          </div>
        ) : stats && stats.recent.length > 0 ? (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th scope="col">Post</th>
                  <th scope="col">Status</th>
                  <th scope="col">Category</th>
                  <th scope="col">Updated</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((post) => (
                  <tr key={post.id}>
                    <td data-label="Post">
                      <Link href={`/admin/posts/${post.id}/edit/`}>{post.title}</Link>
                      <div className="a-muted">{post.slug}</div>
                    </td>
                    <td data-label="Status">
                      <span className={`a-status a-status-${post.status}`}>{post.status}</span>
                    </td>
                    <td data-label="Category">{CATEGORY_META[post.categories[0]]?.label ?? "—"}</td>
                    <td data-label="Updated" className="a-muted">
                      {formatAdminDate(new Date(post.updatedAt))}
                    </td>
                    <td data-label="Actions">
                      <Link
                        className="a-icon-btn"
                        href={`/admin/posts/${post.id}/edit/`}
                        aria-label={`Edit ${post.title}`}
                        title="Edit post"
                      >
                        <Icon name="pen" size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="a-empty">
            <span className="a-empty-icon">
              <Icon name="pen" size={22} />
            </span>
            <strong>No posts yet</strong>
            <span>Your latest writing will show up here.</span>
            <div className="a-empty-actions">
              <Link className="a-btn a-btn-sm" href="/admin/posts/new/">
                Create your first post
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
