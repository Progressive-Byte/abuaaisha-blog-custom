"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";
import type { PostStatus } from "@/lib/admin-types";

export function PreviewActions({ id, status }: { id: string; status: PostStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function publish() {
    setLoading(true);
    setMessage("");
    try {
      await api(`/admin/posts/${id}/status`, { method: "POST", body: JSON.stringify({ status: "published" }) });
      setCurrent("published");
      setMessage("Published. The public cache will refresh shortly.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="a-preview-bar">
      <span className="a-row" style={{ gap: "0.45rem" }}>
        <Icon name="eye" size={18} />
        <span>
          Previewing a <strong>{current}</strong> post. This page is private and not indexed.
          <span aria-live="polite">{message ? ` ${message}` : ""}</span>
        </span>
      </span>
      <span className="a-row">
        <a className="a-btn a-btn-outline a-btn-sm" href={`/admin/posts/${id}/edit/`}>
          Back to editor
        </a>
        {current !== "published" ? (
          <button className="a-btn a-btn-sm" type="button" onClick={publish} disabled={loading}>
            {loading ? <span className="a-spinner" aria-hidden="true" /> : null}
            Publish now
          </button>
        ) : null}
      </span>
    </div>
  );
}
