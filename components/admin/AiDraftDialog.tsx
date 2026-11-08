"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";
import type { AiDraft } from "@/lib/admin-types";
import { CATEGORIES_LABEL } from "@/lib/admin-constants";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (draft: AiDraft) => void;
}

export function AiDraftDialog({ open, onClose, onApply }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const topicRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [lead, setLead] = useState("social");
  const [language, setLanguage] = useState("bn");
  const [tone, setTone] = useState("warm, practical");
  const [length, setLength] = useState("medium");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      window.setTimeout(() => topicRef.current?.focus(), 0);
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { draft } = await api<{ draft: AiDraft }>("/admin/ai/generate", {
        method: "POST",
        body: JSON.stringify({ topic, audience, category: lead, language, tone, length, keywords }),
      });
      onApply(draft);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="a-modal"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onClose();
      }}
    >
      <div className="a-modal-head">
        <h2 id={titleId}>Generate a draft with AI</h2>
        <button className="a-modal-close" type="button" aria-label="Close dialog" onClick={onClose} disabled={loading}>
          <Icon name="close" size={20} />
        </button>
      </div>
      <p id={descriptionId}>
        The result is inserted into the editor as an editable draft. It is never published automatically — review and edit
        everything first.
      </p>

      <form className="a-stack" onSubmit={onSubmit}>
        <div className="a-field">
          <label htmlFor="ai-topic">
            Topic or prompt <span className="a-req">*</span>
          </label>
          <textarea
            id="ai-topic"
            ref={topicRef}
            className="a-textarea"
            rows={3}
            minLength={5}
            maxLength={2000}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            required
            placeholder="What should the post be about?"
          />
        </div>

        <div className="a-field">
          <label htmlFor="ai-audience">Target audience</label>
          <input
            id="ai-audience"
            className="a-input"
            maxLength={300}
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            placeholder="e.g. parents of teenagers in Bangladesh"
          />
        </div>

        <div className="a-row">
          <div className="a-field" style={{ flex: "1 1 8rem" }}>
            <label htmlFor="ai-language">Language</label>
            <select
              id="ai-language"
              className="a-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="bn">Bengali</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="a-field" style={{ flex: "1 1 8rem" }}>
            <label htmlFor="ai-category">Category</label>
            <select id="ai-category" className="a-select" value={lead} onChange={(event) => setLead(event.target.value)}>
              {CATEGORIES_LABEL.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="a-row">
          <div className="a-field" style={{ flex: "1 1 10rem" }}>
            <label htmlFor="ai-tone">Tone</label>
            <input
              id="ai-tone"
              className="a-input"
              maxLength={100}
              value={tone}
              onChange={(event) => setTone(event.target.value)}
            />
          </div>
          <div className="a-field" style={{ flex: "1 1 8rem" }}>
            <label htmlFor="ai-length">Length</label>
            <select
              id="ai-length"
              className="a-select"
              value={length}
              onChange={(event) => setLength(event.target.value)}
            >
              <option value="short">Short (~700 words)</option>
              <option value="medium">Medium (~1200 words)</option>
              <option value="long">Long (~2000 words)</option>
            </select>
          </div>
        </div>

        <div className="a-field">
          <label htmlFor="ai-keywords">Optional keywords</label>
          <input
            id="ai-keywords"
            className="a-input"
            maxLength={500}
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
          />
        </div>

        {error ? (
          <div className="a-banner a-banner-error" role="alert">
            <Icon name="alert-circle" size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="a-modal-actions">
          <button className="a-btn a-btn-outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="a-btn" type="submit" disabled={loading}>
            {loading ? <span className="a-spinner" aria-hidden="true" /> : null}
            {loading ? "Generating…" : "Generate draft"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
