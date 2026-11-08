"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Icon } from "@/components/Icon";
import { AdminBackLink } from "./AdminBackLink";
import { ConfirmDialog } from "./ConfirmDialog";
import { PostPreviewDialog } from "./PostPreviewDialog";
import { api, ApiError } from "@/lib/api-client";
import type { AdminPostSummary, PostsResponse } from "@/lib/admin-types";
import { CATEGORY_META, CATEGORIES_LABEL } from "@/lib/admin-constants";
import { SITE } from "@/lib/site";
import { formatAdminDate } from "@/lib/format";

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
  const [reload, setReload] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<AdminPostSummary | null>(null);
  const [pendingUnpublish, setPendingUnpublish] = useState<AdminPostSummary | null>(null);
  const [previewPost, setPreviewPost] = useState<AdminPostSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const hasFilters = Boolean(query.trim() || status || category);

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
  }, [params, reload]);

  function clearFilters() {
    setQuery("");
    setStatus("");
    setCategory("");
    setPage(1);
  }

  async function setPostStatus(post: AdminPostSummary, next: "draft" | "published") {
    setBusyId(post.id);
    try {
      await api(`/admin/posts/${post.id}/status`, { method: "POST", body: JSON.stringify({ status: next }) });
      setPosts((current) => current.map((item) => (item.id === post.id ? { ...item, status: next } : item)));
      toast.success(next === "published" ? "Post published." : "Post unpublished.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  function requestStatusChange(post: AdminPostSummary) {
    if (post.status === "published") {
      setPendingUnpublish(post);
      return;
    }
    void setPostStatus(post, "published");
  }

  async function confirmUnpublish() {
    if (!pendingUnpublish) return;
    setUnpublishing(true);
    try {
      await setPostStatus(pendingUnpublish, "draft");
    } finally {
      setUnpublishing(false);
      setPendingUnpublish(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/admin/posts/${pendingDelete.id}`, { method: "DELETE" });
      toast.success("Post deleted.");
      if (posts.length === 1 && page > 1) setPage(page - 1);
      else setReload((value) => value + 1);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const start = posts.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = (page - 1) * PER_PAGE + posts.length;

  return (
    <div className="a-stack">
      <header className="a-page-head">
        <div>
          <AdminBackLink href="/admin/" label="Back to dashboard" />
          <h1 className="a-title">All posts</h1>
          <p className="a-subtitle">
            {total} {total === 1 ? "post" : "posts"}
          </p>
        </div>
        <div className="a-page-actions">
          <Link className="a-btn" href="/admin/posts/new/">
            <Icon name="pen" size={16} />
            New post
          </Link>
        </div>
      </header>

      <section className="a-card a-stack">
        <div className="a-filters">
          <div className="a-field">
            <label htmlFor="admin-search">Search</label>
            <div className="a-search">
              <Icon name="search" size={18} />
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
          {hasFilters ? (
            <button className="a-btn a-btn-ghost a-btn-sm" type="button" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="a-banner a-banner-error" role="alert">
            <Icon name="alert-circle" size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="a-table-wrap">
          <table className="a-table" aria-busy={loading}>
            <thead>
              <tr>
                <th scope="col">Post</th>
                <th scope="col">Status</th>
                <th scope="col">Category</th>
                <th scope="col">Date</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && posts.length === 0 ? (
                <tr>
                  <td colSpan={5}>
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
                    </div>
                    <p className="visually-hidden">Loading posts…</p>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="a-empty">
                      <span className="a-empty-icon">
                        <Icon name={hasFilters ? "search" : "book"} size={22} />
                      </span>
                      <strong>{hasFilters ? "No posts match these filters" : "No posts yet"}</strong>
                      <span>
                        {hasFilters ? "Try a different search or clear the filters." : "Create your first post to get started."}
                      </span>
                      <div className="a-empty-actions">
                        {hasFilters ? (
                          <button className="a-btn a-btn-outline a-btn-sm" type="button" onClick={clearFilters}>
                            Clear filters
                          </button>
                        ) : (
                          <Link className="a-btn a-btn-sm" href="/admin/posts/new/">
                            New post
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td data-label="Post">
                      <div className="a-row" style={{ flexWrap: "nowrap" }}>
                        {post.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="a-thumb" src={post.image.url} alt="" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="a-thumb" src={SITE.postPlaceholder} alt="" />
                        )}
                        <div>
                          <Link href={`/admin/posts/${post.id}/edit/`}>{post.title}</Link>
                          <div className="a-muted">{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className={`a-status a-status-${post.status}`}>{post.status}</span>
                    </td>
                    <td data-label="Category">{CATEGORY_META[post.categories[0]]?.label ?? "—"}</td>
                    <td data-label="Date" className="a-muted">
                      {formatAdminDate(new Date(post.publishedAt))}
                    </td>
                    <td data-label="Actions">
                      <div className="a-row">
                        <button
                          className="a-icon-btn"
                          type="button"
                          aria-label={`Preview ${post.title}`}
                          title="Preview post"
                          onClick={() => setPreviewPost(post)}
                        >
                          <Icon name="eye" size={16} />
                        </button>
                        <Link
                          className="a-icon-btn"
                          href={`/admin/posts/${post.id}/edit/`}
                          aria-label={`Edit ${post.title}`}
                          title="Edit post"
                        >
                          <Icon name="pen" size={16} />
                        </Link>
                        <button
                          className="a-icon-btn"
                          type="button"
                          disabled={busyId === post.id}
                          aria-label={`${post.status === "published" ? "Unpublish" : "Publish"} ${post.title}`}
                          title={post.status === "published" ? "Unpublish" : "Publish"}
                          onClick={() => requestStatusChange(post)}
                        >
                          {busyId === post.id ? (
                            <span className="a-spinner a-spinner-dark" aria-hidden="true" />
                          ) : (
                            <Icon name={post.status === "published" ? "eye-off" : "check-circle"} size={16} />
                          )}
                        </button>
                        <button
                          className="a-icon-btn is-danger"
                          type="button"
                          aria-label={`Delete ${post.title}`}
                          title="Delete post"
                          onClick={() => setPendingDelete(post)}
                        >
                          <Icon name="trash" size={16} />
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
            {posts.length === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
          </span>
          <div className="a-row">
            <button
              className="a-btn a-btn-outline a-btn-sm"
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <Icon name="chevron-left" size={15} />
              Previous
            </button>
            <button
              className="a-btn a-btn-outline a-btn-sm"
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
            >
              Next
              <Icon name="chevron-right" size={15} />
            </button>
          </div>
        </div>
      </section>

      <PostPreviewDialog post={previewPost} onClose={() => setPreviewPost(null)} />

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

      <ConfirmDialog
        open={Boolean(pendingUnpublish)}
        title="Unpublish this post?"
        description={
          pendingUnpublish
            ? `“${pendingUnpublish.title}” will be hidden from the public site and its URL will start returning 404. You can publish it again at any time.`
            : ""
        }
        confirmLabel="Unpublish"
        loading={unpublishing}
        onConfirm={confirmUnpublish}
        onCancel={() => setPendingUnpublish(null)}
      />
    </div>
  );
}
