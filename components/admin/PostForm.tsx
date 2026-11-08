"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AiDraftDialog } from "./AiDraftDialog";
import { AdminBackLink } from "./AdminBackLink";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImageUploader } from "./ImageUploader";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";
import type { AdminCategory, AdminPost, AdminPostImage, AdminPostSource, AiDraft, PostStatus } from "@/lib/admin-types";
import { CATEGORIES_LABEL } from "@/lib/admin-constants";
import { SLUG_PATTERN, slugifyTitle } from "@/lib/post-schema";

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

interface FieldIssue {
  field: string;
  message: string;
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
  const [issue, setIssue] = useState<FieldIssue | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<AiDraft | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const [slugAuto, setSlugAuto] = useState(!initial);
  const dirtyRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerFloating, setHeaderFloating] = useState(false);

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
    const element = headerRef.current;
    if (!element) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const stickyTop = Number.parseFloat(window.getComputedStyle(element).top) || 0;
      // The header's static document position does not change when its height
      // collapses, so this threshold is stable and cannot feed back into itself.
      const parent = element.offsetParent as HTMLElement | null;
      const parentTop = parent ? parent.getBoundingClientRect().top + window.scrollY : 0;
      const naturalTop = parentTop + element.offsetTop;
      setHeaderFloating(window.scrollY + stickyTop >= naturalTop - 1);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function update(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
    dirtyRef.current = true;
    setIssue(null);
  }

  function onTitleChange(value: string) {
    setForm((current) => {
      const next = { ...current, title: value };
      if (slugAuto) next.slug = slugifyTitle(value);
      return next;
    });
    setDirty(true);
    dirtyRef.current = true;
    setIssue(null);
  }

  function onSlugChange(value: string) {
    setSlugAuto(false);
    update({ slug: value.toLowerCase().replace(/\s+/g, "-") });
  }

  function generateSlug() {
    setSlugAuto(true);
    update({ slug: slugifyTitle(form.title) });
  }

  function restore() {
    if (!savedDraft) return;
    setForm(savedDraft.form);
    setStatus(initial?.status ?? "draft");
    setSavedDraft(null);
    setSlugAuto(false);
    setDirty(true);
    dirtyRef.current = true;
    toast.success("Unsaved changes restored.");
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

  function validate(): FieldIssue | null {
    if (!form.title.trim()) return { field: "post-title", message: "Title is required." };
    if (!SLUG_PATTERN.test(form.slug.trim()))
      return { field: "post-slug", message: "Use letters, numbers and single hyphens (e.g. my-post-title)." };
    if (!form.summary.trim()) return { field: "post-summary", message: "Summary is required." };
    if (!form.body.trim()) return { field: "post-body", message: "Body is required." };
    if (form.categories.length === 0) return { field: "post-categories", message: "Choose at least one category." };
    if (form.image && !form.image.alt.trim())
      return { field: "cover-alt", message: "Alt text is required when a cover image is set." };
    if (!form.publishedAt) return { field: "post-date", message: "Publish date is required." };
    return null;
  }

  function showIssue(problem: FieldIssue) {
    setIssue(problem);
    setError(problem.message);
    window.requestAnimationFrame(() => document.getElementById(problem.field)?.focus());
  }

  async function persist(options: { status: PostStatus; silent?: boolean }): Promise<AdminPost | null> {
    const problem = validate();
    if (problem) {
      showIssue(problem);
      return null;
    }

    setSaving(true);
    setError("");
    setIssue(null);
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

      if (!options.silent) toast.success(options.status === "published" ? "Post published." : "Draft saved.");
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
      toast.error(message);
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
      setPendingDraft(draft);
      return;
    }
    insertDraft(draft);
  }

  function insertDraft(draft: AiDraft) {
    update({
      title: draft.title,
      summary: draft.summary,
      description: draft.description,
      body: draft.body,
      sources: draft.sources,
      aiGenerated: true,
      ...(slugAuto ? { slug: slugifyTitle(draft.title) } : {}),
    });
    toast.success("AI draft inserted. Review and edit before publishing.");
  }

  return (
    <div className="a-stack">
      <header
        ref={headerRef}
        className={`a-page-head a-page-head--sticky ${headerFloating ? "is-floating" : ""}`}
      >
        <div>
          <AdminBackLink href="/admin/posts/" label="Back to all posts" />
          <h1 className="a-title">{mode === "new" ? "New post" : "Edit post"}</h1>
          <p className="a-subtitle">
            <span className={`a-status a-status-${status}`}>{status}</span>
            {initial ? <span className="a-muted">/ {initial.slug}</span> : null}
            {dirty ? <span className="a-unsaved">Unsaved changes</span> : null}
          </p>
        </div>
        <div className="a-page-actions">
          {initial ? (
            <button className="a-btn a-btn-outline" type="button" onClick={preview} disabled={saving}>
              <Icon name="eye" size={16} />
              Preview
            </button>
          ) : null}
          <button className="a-btn a-btn-outline" type="button" onClick={() => setAiOpen(true)} disabled={saving}>
            <Icon name="star" size={16} />
            Generate with AI
          </button>
          {status !== "published" ? (
            <button className="a-btn a-btn-outline" type="button" onClick={() => persist({ status: "draft" })} disabled={saving}>
              {saving ? <span className="a-spinner a-spinner-dark" aria-hidden="true" /> : null}
              Save draft
            </button>
          ) : null}
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
          <Icon name="history" size={18} />
          <div className="a-row" style={{ justifyContent: "space-between", flex: 1 }}>
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
        <div className="a-banner a-banner-error" role="alert">
          <Icon name="alert-circle" size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="a-form-layout">
        <div className="a-stack">
          <section className="a-card a-stack">
            <div className="a-field">
              <label htmlFor="post-title">
                Title <span className="a-req">*</span>
              </label>
              <input
                id="post-title"
                className="a-input"
                value={form.title}
                maxLength={300}
                onChange={(event) => onTitleChange(event.target.value)}
                aria-invalid={issue?.field === "post-title"}
              />
              {issue?.field === "post-title" ? (
                <span className="a-error-text">
                  <Icon name="alert-circle" size={14} />
                  {issue.message}
                </span>
              ) : null}
            </div>

            <div className="a-field">
              <label htmlFor="post-slug">
                Slug (URL) <span className="a-req">*</span>
              </label>
              <div className="a-slug-row">
                <input
                  id="post-slug"
                  className="a-input"
                  value={form.slug}
                  maxLength={120}
                  onChange={(event) => onSlugChange(event.target.value)}
                  placeholder="my-post-title"
                  aria-invalid={issue?.field === "post-slug"}
                />
                <button
                  className="a-btn a-btn-outline"
                  type="button"
                  onClick={generateSlug}
                  disabled={!form.title.trim()}
                  title="Generate the slug from the title"
                >
                  <Icon name="refresh" size={16} />
                  Generate
                </button>
              </div>
              <small>
                {slugAuto
                  ? "Auto-generated from the title. Type in the field to customize it."
                  : "Custom slug. Changing the slug of an existing post breaks its old URL."}
              </small>
              {issue?.field === "post-slug" ? (
                <span className="a-error-text">
                  <Icon name="alert-circle" size={14} />
                  {issue.message}
                </span>
              ) : null}
            </div>

            <div className="a-field">
              <label htmlFor="post-summary">
                Summary <span className="a-req">*</span>
              </label>
              <textarea
                id="post-summary"
                className="a-textarea"
                rows={2}
                maxLength={1000}
                value={form.summary}
                onChange={(event) => update({ summary: event.target.value })}
                aria-invalid={issue?.field === "post-summary"}
              />
              <small>
                Shown on post cards. {form.summary.length}/1000 characters.
              </small>
              {issue?.field === "post-summary" ? (
                <span className="a-error-text">
                  <Icon name="alert-circle" size={14} />
                  {issue.message}
                </span>
              ) : null}
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
              <small>
                Used for meta description and social previews. Falls back to the summary. {form.description.length}/2000
                characters.
              </small>
            </div>
          </section>

          <section className="a-card a-stack">
            <div className="a-field">
              <label htmlFor="post-body">
                Body (Markdown) <span className="a-req">*</span>
              </label>
              <textarea
                id="post-body"
                className="a-textarea a-body-input"
                value={form.body}
                onChange={(event) => update({ body: event.target.value })}
                spellCheck={false}
                aria-invalid={issue?.field === "post-body"}
              />
              <small>Markdown only. HTML is stripped when rendered. Use ## for section headings, &gt; for quotes.</small>
              {issue?.field === "post-body" ? (
                <span className="a-error-text">
                  <Icon name="alert-circle" size={14} />
                  {issue.message}
                </span>
              ) : null}
            </div>
          </section>

          <section className="a-card a-stack">
            <div className="a-card-head">
              <div>
                <h2 className="a-section-title">Sources</h2>
                <p className="a-subtitle" style={{ marginTop: "0.2rem" }}>
                  Verify every link before publishing. Optional.
                </p>
              </div>
              <button className="a-btn a-btn-outline a-btn-sm" type="button" onClick={addSource}>
                <Icon name="plus" size={15} />
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
                  <button
                    className="a-icon-btn is-danger"
                    type="button"
                    aria-label={`Remove source ${index + 1}`}
                    title="Remove source"
                    onClick={() => removeSource(index)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))
            )}
          </section>
        </div>

        <div className="a-stack">
          <section className="a-card a-stack">
            <h2 className="a-section-title">Publishing</h2>
            <div className="a-field">
              <label htmlFor="post-date">
                Publish date <span className="a-req">*</span>
              </label>
              <input
                id="post-date"
                className="a-input"
                type="date"
                value={form.publishedAt}
                onChange={(event) => update({ publishedAt: event.target.value })}
                aria-invalid={issue?.field === "post-date"}
              />
              {issue?.field === "post-date" ? (
                <span className="a-error-text">
                  <Icon name="alert-circle" size={14} />
                  {issue.message}
                </span>
              ) : null}
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
              <button className="a-btn a-btn-outline" type="button" onClick={() => setUnpublishOpen(true)} disabled={saving}>
                <Icon name="eye-off" size={16} />
                Unpublish
              </button>
            ) : null}
            {initial ? (
              <a className="a-btn a-btn-ghost" href={`/posts/${form.slug}/`} target="_blank" rel="noreferrer">
                <Icon name="arrow-up-right" size={16} />
                View public URL
              </a>
            ) : null}
          </section>

          <section className="a-card a-stack">
            <h2 className="a-section-title">Cover image</h2>
            <ImageUploader value={form.image} onChange={(image) => update({ image })} />
          </section>

          <section className="a-card a-stack">
            <h2 className="a-section-title">
              Categories <span className="a-req">*</span>
            </h2>
            <div className="a-checks" id="post-categories" tabIndex={-1}>
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
            {issue?.field === "post-categories" ? (
              <span className="a-error-text">
                <Icon name="alert-circle" size={14} />
                {issue.message}
              </span>
            ) : null}
            {form.aiGenerated ? (
              <p className="a-banner a-banner-info">
                <Icon name="star" size={16} />
                This draft was started with AI assistance.
              </p>
            ) : null}
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

      <ConfirmDialog
        open={unpublishOpen}
        title="Unpublish this post?"
        description="The post will be hidden from the public site and its URL will start returning 404. You can publish it again at any time."
        confirmLabel="Unpublish"
        loading={saving}
        onConfirm={async () => {
          setUnpublishOpen(false);
          await persist({ status: "draft" });
        }}
        onCancel={() => setUnpublishOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(pendingDraft)}
        title="Replace current content?"
        description="The AI draft will replace the title, summary, SEO description, body and sources currently in the editor."
        confirmLabel="Replace content"
        danger
        onConfirm={() => {
          if (pendingDraft) insertDraft(pendingDraft);
          setPendingDraft(null);
        }}
        onCancel={() => setPendingDraft(null)}
      />
    </div>
  );
}
