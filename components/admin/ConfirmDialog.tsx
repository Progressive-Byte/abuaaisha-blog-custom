"use client";

import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="a-modal"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
      <div className="a-modal-actions">
        <button className="a-btn a-btn-outline" type="button" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          className={`a-btn ${danger ? "a-btn-danger" : ""}`}
          type="button"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <span className="a-spinner" aria-hidden="true" /> : null}
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
