"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AiDraftDialog } from "./AiDraftDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImageUploader } from "./ImageUploader";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";
import type { AdminCategory, AdminPost, AdminPostImage, AdminPostSource, AiDraft, PostStatus } from "@/lib/admin-types";
import { CATEGORIES_LABEL } from "@/lib/admin-constants";
import { POST_SLUG_PATTERN } from "@/lib/post-schema";

interface FormState {
  title: string;
  slug: string;
  summary: string;
  description: string;
  body: string;
  categories: AdminCategory[];
  lang: "bn" | "en";
  publishedAt: string;
  image: AdminPostImage | null;
  sources: AdminPostSource[];
  aiGenerated: boolean;
}

function fromPost(post?: AdminPost): FormState {
  if (!post) {
    return {
      title: "",
      slug: "",
      summary: "",
      description: "",
      body: "",
      categories: ["social"],
      lang: "bn",
      publishedAt: new Date().toISOString().slice(0, 10),
      image: null,
      sources: [],
      aiGenerated: false,
    };
  }
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    description: post.description,
    body: post.body,
    categories: post.categories,
    lang: post.lang,
    publishedAt: post.publishedAt.slice(0, 10),
    image: post.image,
    sources: post.sources ?? [],
    aiGenerated: post.aiGenerated,
  };
}

interface SavedDraft {
  savedAt: number;
  form: FormState;
}

export function PostForm({ mode, initial }: { mode: "new" | "edit"; initial?: AdminPost }) {
  const router = useRouter();
  const storageKey = `abuaaisha:post-draft:${initial?.id ?? "new"}`;

  const [postId, setPostId] = useState<string | undefined>(initial?.id);
  const [form, setForm] = useState<FormState>(() => fromPost(initial));
  const [dirty, setDirty] = useState(false);
  const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const dirtyRef = useRef(false);

  useEffect(() => {
    let timer: number | undefined;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedDraft;
      if (parsed?.form) timer = window.setTimeout(() => setSavedDraft(parsed), 0);
    } catch {
      // Ignore corrupt autosave data.
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [storageKey]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), form }));
      } catch {
        // Storage may be full or blocked.
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [form, dirty, storageKey]);

  useEffect(() => {
    const handler = () => {
      if (!dirtyRef.current) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), form }));
      } catch {
        // Ignore.
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form, storageKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function update(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
    dirtyRef.current = true;
  }

  function restore() {
    if (!savedDraft) return;
    setForm(savedDraft.form);
    setStatus(initial?.status ?? "draft");
    setSavedDraft(null);
    setDirty(true);
    dirtyRef.current = true;
    setToast({ text: "Unsaved changes restored." });
  }

  function discardSaved() {
    localStorage.removeItem(storageKey);
    setSavedDraft(null);
  }

  function toggleCategory(value: AdminCategory) {
    update({
      categories: form.categories.includes(value)
        ? form.categories.filter((item) => item !== value)
        : [...form.categories, value],
    });
  }

  function updateSource(index: number, patch: Partial<AdminPostSource>) {
    update({
      sources: form.sources.map((source, i) => (i === index ? { ...source, ...patch } : source)),
    });
  }

  function addSource() {
    update({ sources: [...form.sources, { title: "", url: "" }] });
  }

  function removeSource(index: number) {
    update({ sources: form.sources.filter((_, i) => i !== index) });
  }

  function validate(): string {
    if (!form.title.trim()) return "Title is required.";
    if (!POST_SLUG_PATTERN.test(form.slug.trim())) return "Slug must look like 033s22 (3 digits, f/s/w, then 2+ digits).";
    if (!form.summary.trim()) return "Summary is required.";
    if (!form.body.trim()) return "Body is required.";
    if (form.categories.length === 0) return "Choose at least one category.";
    if (form.image && !form.image.alt.trim()) return "Alt text is required when a cover image is set.";
    if (!form.publishedAt) return "Publish date is required.";
    return "";
  }

  async function persist(options: { status: PostStatus; silent?: boolean }): Promise<AdminPost | null> {
    const problem = validate();
    if (problem) {
      setError(problem);
      setToast({ text: problem, error: true });
      return null;
    }

    setSaving(true);
    setError("");
    const payload = {
      ...form,
      status: options.status,
      publishedAt: new Date(`${form.publishedAt}T00:00:00.000Z`).toISOString(),
      description: form.description.trim() || undefined,
      image: form.image ?? undefined,
      sources: form.sources.filter((source) => source.title.trim() && source.url.trim()),
    };

    try {
      const data = postId
        ? await api<{ post: AdminPost }>(`/admin/posts/${postId}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await api<{ post: AdminPost }>("/admin/posts", { method: "POST", body: JSON.stringify(payload) });

      localStorage.removeItem(storageKey);
      setSavedDraft(null);
      setDirty(false);
      dirtyRef.current = false;
      setStatus(data.post.status);
      setForm(fromPost(data.post));

      if (!options.silent) setToast({ text: options.status === "published" ? "Post published." : "Draft saved." });
      // Remember the new id so later saves (including after a silent preview) PATCH instead of POSTing again.
      if (!postId) {
        setPostId(data.post.id);
        router.replace(`/admin/posts/${data.post.id}/edit/`);
      }
      router.refresh();
      return data.post;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Save failed";
      setError(message);
      setToast({ text: message, error: true });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function preview() {
    const saved = await persist({ status, silent: true });
    if (saved) window.open(`/admin/posts/${saved.id}/preview/`, "_blank", "noopener");
  }

  function applyDraft(draft: AiDraft) {
    if (form.body.trim()) {
      const ok = window.confirm("Replace the current body and title with the AI draft?");
      if (!ok) return;
    }
    update({
      title: draft.title,
      summary: draft.summary,
      description: draft.description,
      body: draft.body,
      sources: draft.sources,
      aiGenerated: true,
    });
    setToast({ text: "AI draft inserted. Review and edit before publishing." });
  }

  return (
    <div className="a-stack">
      <header className="a-page-head">
        <div>
          <h1 className="a-title">{mode === "new" ? "New post" : "Edit post"}</h1>
          <p className="a-subtitle">
            <span className={`a-status a-status-${status}`}>{status}</span>{" "}
            {initial ? <span className="a-muted">/ {initial.slug}</span> : null}
          </p>
        </div>
        <div className="a-row">
          {initial ? (
            <button className="a-btn a-btn-outline" type="button" onClick={preview} disabled={saving}>
              <Icon name="search" size={16} />
              Preview
            </button>
          ) : null}
          <button className="a-btn a-btn-outline" type="button" onClick={() => setAiOpen(true)} disabled={saving}>
            <Icon name="pen" size={16} />
            Generate with AI
          </button>
          <button className="a-btn a-btn-outline" type="button" onClick={() => persist({ status: "draft" })} disabled={saving}>
            Save draft
          </button>
          {status === "published" ? (
            <button className="a-btn" type="button" onClick={() => persist({ status: "published" })} disabled={saving}>
              {saving ? <span className="a-spinner" aria-hidden="true" /> : null}
              Save changes
            </button>
          ) : (
            <button className="a-btn" type="button" onClick={() => setPublishOpen(true)} disabled={saving}>
              Publish
            </button>
          )}
        </div>
      </header>

      {savedDraft ? (
        <div className="a-banner a-banner-info">
          <div className="a-row" style={{ justifyContent: "space-between" }}>
            <span>Unsaved changes from {new Date(savedDraft.savedAt).toLocaleString()} were found.</span>
            <span className="a-row">
              <button className="a-btn a-btn-sm" type="button" onClick={restore}>
                Restore
              </button>
              <button className="a-btn a-btn-outline a-btn-sm" type="button" onClick={discardSaved}>
                Discard
              </button>
            </span>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="a-banner a-banner-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="a-form-layout">
        <div className="a-stack">
          <section className="a-card a-stack">
            <div className="a-field">
              <label htmlFor="post-title">Title</label>
              <input
                id="post-title"
                className="a-input"
                value={form.title}
                maxLength={300}
                onChange={(event) => update({ title: event.target.value })}
              />
            </div>

            <div className="a-field">
              <label htmlFor="post-slug">Slug (URL)</label>
              <input
                id="post-slug"
                className="a-input"
                value={form.slug}
                onChange={(event) => update({ slug: event.target.value.trim() })}
                placeholder="033s22"
              />
              <small>Stable identifier. Existing slugs must not change or the old URL breaks. Format: 3 digits + f/s/w + 2 digits.</small>
            </div>

            <div className="a-field">
              <label htmlFor="post-summary">Summary (shown on cards)</label>
              <textarea
                id="post-summary"
                className="a-textarea"
                rows={2}
                maxLength={1000}
                value={form.summary}
                onChange={(event) => update({ summary: event.target.value })}
              />
            </div>

            <div className="a-field">
              <label htmlFor="post-description">SEO description</label>
              <textarea
                id="post-description"
                className="a-textarea"
                rows={3}
                maxLength={2000}
                value={form.description}
                onChange={(event) => update({ description: event.target.value })}
              />
              <small>Used for meta description and social previews. Falls back to the summary.</small>
            </div>
          </section>

          <section className="a-card a-stack">
            <div className="a-field">
              <label htmlFor="post-body">Body (Markdown)</label>
              <textarea
                id="post-body"
                className="a-textarea a-body-input"
                value={form.body}
                onChange={(event) => update({ body: event.target.value })}
                spellCheck={false}
              />
              <small>Markdown only. HTML is stripped when rendered. Use ## for section headings, &gt; for quotes.</small>
            </div>
          </section>

          <section className="a-card a-stack">
            <div className="a-row" style={{ justifyContent: "space-between" }}>
              <div>
                <h2 className="a-title" style={{ fontSize: "1.05rem" }}>
                  Sources
                </h2>
                <p className="a-subtitle">Verify every link before publishing. Optional.</p>
              </div>
              <button className="a-btn a-btn-outline a-btn-sm" type="button" onClick={addSource}>
                Add source
              </button>
            </div>

            {form.sources.length === 0 ? (
              <p className="a-muted">No sources added.</p>
            ) : (
              form.sources.map((source, index) => (
                <div className="a-source-row" key={index}>
                  <input
                    className="a-input"
                    aria-label={`Source ${index + 1} title`}
                    placeholder="Title"
                    value={source.title}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateSource(index, { title: event.target.value })}
                  />
                  <input
                    className="a-input"
                    aria-label={`Source ${index + 1} URL`}
                    placeholder="https://…"
                    value={source.url}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateSource(index, { url: event.target.value })}
                  />
                  <button className="a-btn a-btn-outline a-btn-sm" type="button" onClick={() => removeSource(index)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </section>
        </div>

        <div className="a-stack">
          <section className="a-card a-stack">
            <h2 className="a-title" style={{ fontSize: "1.05rem" }}>
              Publishing
            </h2>
            <div className="a-field">
              <label htmlFor="post-date">Publish date</label>
              <input
                id="post-date"
                className="a-input"
                type="date"
                value={form.publishedAt}
                onChange={(event) => update({ publishedAt: event.target.value })}
              />
            </div>
            <div className="a-field">
              <label htmlFor="post-lang">Language</label>
              <select
                id="post-lang"
                className="a-select"
                value={form.lang}
                onChange={(event) => update({ lang: event.target.value as "bn" | "en" })}
              >
                <option value="bn">Bengali</option>
                <option value="en">English</option>
              </select>
            </div>
            {status === "published" ? (
              <button
                className="a-btn a-btn-outline"
                type="button"
                onClick={() => persist({ status: "draft" })}
                disabled={saving}
              >
                Unpublish
              </button>
            ) : null}
            {initial ? (
              <a className="a-btn a-btn-ghost" href={`/posts/${form.slug}/`} target="_blank" rel="noreferrer">
                View public URL
              </a>
            ) : null}
          </section>

          <section className="a-card a-stack">
            <h2 className="a-title" style={{ fontSize: "1.05rem" }}>
              Cover image
            </h2>
            <ImageUploader value={form.image} onChange={(image) => update({ image })} />
          </section>

          <section className="a-card a-stack">
            <h2 className="a-title" style={{ fontSize: "1.05rem" }}>
              Categories
            </h2>
            <div className="a-checks">
              {CATEGORIES_LABEL.map((item) => (
                <label className="a-check" key={item.value}>
                  <input
                    type="checkbox"
                    checked={form.categories.includes(item.value)}
                    onChange={() => toggleCategory(item.value)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
            {form.aiGenerated ? <p className="a-banner a-banner-info">This draft was started with AI assistance.</p> : null}
          </section>
        </div>
      </div>

      <AiDraftDialog open={aiOpen} onClose={() => setAiOpen(false)} onApply={applyDraft} />

      <ConfirmDialog
        open={publishOpen}
        title="Publish this post?"
        description="It will become visible on the public site immediately (after the cache refreshes). Review the preview first if you have not already."
        confirmLabel="Publish"
        loading={saving}
        onConfirm={async () => {
          setPublishOpen(false);
          await persist({ status: "published" });
        }}
        onCancel={() => setPublishOpen(false)}
      >
        <p className="a-muted">
          Tip: use <strong>Preview</strong> to open the draft exactly as it will render before publishing.
        </p>
      </ConfirmDialog>

      {toast ? <div className={`a-toast ${toast.error ? "a-toast-error" : ""}`}>{toast.text}</div> : null}
    </div>
  );
}
