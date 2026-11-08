"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { ConfirmDialog } from "./ConfirmDialog";
import { api, ApiError } from "@/lib/api-client";
import type { AdminPostSummary, PostsResponse } from "@/lib/admin-types";
import { CATEGORY_META, CATEGORIES_LABEL } from "@/lib/admin-constants";
import { formatDate } from "@/lib/format";

const PER_PAGE = 10;

export function PostList() {
  const [posts, setPosts] = useState<AdminPostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminPostSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const params = useMemo(() => {
    const search = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) });
    if (query.trim()) search.set("q", query.trim());
    if (status) search.set("status", status);
    if (category) search.set("category", category);
    return search.toString();
  }, [page, query, status, category]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      api<PostsResponse>(`/admin/posts?${params}`)
        .then((data) => {
          if (!active) return;
          setPosts(data.posts);
          setTotal(data.total);
          setPages(data.pages);
          setError("");
        })
        .catch((err) => {
          if (active) setError(err instanceof ApiError ? err.message : "Could not load posts");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [params]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function toggleStatus(post: AdminPostSummary) {
    setBusyId(post.id);
    try {
      const next = post.status === "published" ? "draft" : "published";
      await api(`/admin/posts/${post.id}/status`, { method: "POST", body: JSON.stringify({ status: next }) });
      setPosts((current) => current.map((item) => (item.id === post.id ? { ...item, status: next } : item)));
      setToast({ text: next === "published" ? "Post published." : "Post unpublished." });
    } catch (err) {
      setToast({ text: err instanceof ApiError ? err.message : "Update failed", error: true });
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/admin/posts/${pendingDelete.id}`, { method: "DELETE" });
      setPosts((current) => current.filter((item) => item.id !== pendingDelete.id));
      setTotal((value) => Math.max(0, value - 1));
      setToast({ text: "Post deleted." });
      setPendingDelete(null);
    } catch (err) {
      setToast({ text: err instanceof ApiError ? err.message : "Delete failed", error: true });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="a-stack">
      <header className="a-page-head">
        <div>
          <h1 className="a-title">All posts</h1>
          <p className="a-subtitle">
            {total} {total === 1 ? "post" : "posts"}
          </p>
        </div>
        <Link className="a-btn" href="/admin/posts/new/">
          <Icon name="pen" size={16} />
          New post
        </Link>
      </header>

      <section className="a-card a-stack">
        <div className="a-row">
          <div className="a-field" style={{ flex: "1 1 16rem" }}>
            <label htmlFor="admin-search">Search</label>
            <input
              id="admin-search"
              className="a-input"
              type="search"
              placeholder="Title, summary or slug"
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
            />
          </div>
          <div className="a-field">
            <label htmlFor="admin-status">Status</label>
            <select
              id="admin-status"
              className="a-select"
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
            >
              <option value="">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="a-field">
            <label htmlFor="admin-category">Category</label>
            <select
              id="admin-category"
              className="a-select"
              value={category}
              onChange={(event) => {
                setPage(1);
                setCategory(event.target.value);
              }}
            >
              <option value="">All</option>
              {CATEGORIES_LABEL.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="a-banner a-banner-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Status</th>
                <th>Category</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="a-empty">
                    Loading posts…
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="a-empty">
                    No posts match these filters.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className="a-row" style={{ flexWrap: "nowrap" }}>
                        {post.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="a-thumb" src={post.image.url} alt="" />
                        ) : (
                          <div className="a-thumb" aria-hidden="true" />
                        )}
                        <div>
                          <Link href={`/admin/posts/${post.id}/edit/`}>{post.title}</Link>
                          <div className="a-muted">{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`a-status a-status-${post.status}`}>{post.status}</span>
                    </td>
                    <td>{CATEGORY_META[post.categories[0]].label}</td>
                    <td className="a-muted">{formatDate(new Date(post.publishedAt))}</td>
                    <td>
                      <div className="a-row" style={{ flexWrap: "nowrap" }}>
                        <Link className="a-btn a-btn-outline a-btn-sm" href={`/admin/posts/${post.id}/edit/`}>
                          Edit
                        </Link>
                        <button
                          className="a-btn a-btn-outline a-btn-sm"
                          type="button"
                          disabled={busyId === post.id}
                          onClick={() => toggleStatus(post)}
                        >
                          {post.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          className="a-btn a-btn-danger a-btn-sm"
                          type="button"
                          onClick={() => setPendingDelete(post)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="a-pagination">
          <span className="a-muted">
            Page {page} of {pages}
          </span>
          <div className="a-row">
            <button
              className="a-btn a-btn-outline a-btn-sm"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </button>
            <button
              className="a-btn a-btn-outline a-btn-sm"
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this post?"
        description={
          pendingDelete
            ? `“${pendingDelete.title}” will be permanently removed from the database. This cannot be undone. Published URLs will start returning 404.`
            : ""
        }
        confirmLabel="Delete post"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {toast ? <div className={`a-toast ${toast.error ? "a-toast-error" : ""}`}>{toast.text}</div> : null}
    </div>
  );
}
