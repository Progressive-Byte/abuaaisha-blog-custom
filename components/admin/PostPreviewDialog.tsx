"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import type { AdminPostSummary } from "@/lib/admin-types";

interface Props {
  post: AdminPostSummary | null;
  onClose: () => void;
}

export function PostPreviewDialog({ post, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (post && !dialog.open) {
      setLoaded(false);
      dialog.showModal();
    }
    if (!post && dialog.open) dialog.close();
  }, [post]);

  return (
    <dialog
      ref={ref}
      className="a-preview-modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {post ? (
        <>
          <div className="a-preview-head">
            <div className="a-preview-title">
              <span className={`a-status a-status-${post.status}`}>{post.status}</span>
              <h2 id={titleId}>{post.title}</h2>
            </div>
            <div className="a-row">
              <a
                className="a-btn a-btn-outline a-btn-sm"
                href={`/admin/posts/${post.id}/preview/`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="arrow-up-right" size={15} />
                Open full preview
              </a>
              <button className="a-modal-close" type="button" aria-label="Close preview" onClick={onClose}>
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>
          <div className="a-preview-frame">
            {!loaded ? (
              <div className="a-preview-loading" aria-live="polite">
                <span className="a-spinner a-spinner-dark" aria-hidden="true" />
                Loading preview…
              </div>
            ) : null}
            <iframe
              key={post.id}
              src={`/admin/preview/${post.id}/`}
              title={`Preview of ${post.title}`}
              onLoad={() => setLoaded(true)}
            />
          </div>
        </>
      ) : null}
    </dialog>
  );
}
