"use client";

import { useState, type ChangeEvent } from "react";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";
import type { AdminPostImage } from "@/lib/admin-types";

interface Props {
  value: AdminPostImage | null;
  onChange: (image: AdminPostImage | null) => void;
}

interface Signature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  transformation: string;
  allowedFormats: string;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

export function ImageUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    if (!ALLOWED.includes(file.type)) {
      setError("Use a JPEG, PNG, WebP or AVIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is larger than 8 MB.");
      return;
    }

    setUploading(true);
    try {
      const signature = await api<Signature>("/admin/uploads/sign", { method: "POST", body: JSON.stringify({}) });
      const data = new FormData();
      data.append("file", file);
      data.append("api_key", signature.apiKey);
      data.append("timestamp", String(signature.timestamp));
      data.append("signature", signature.signature);
      data.append("folder", signature.folder);
      data.append("transformation", signature.transformation);
      data.append("allowed_formats", signature.allowedFormats);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
        { method: "POST", body: data },
      );
      const uploaded = (await response.json().catch(() => ({}))) as {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
      };
      if (!response.ok || !uploaded.secure_url) {
        throw new Error(uploaded.error?.message ?? "Cloudinary upload failed");
      }

      const verified = await api<{ url: string; publicId?: string }>("/admin/uploads/verify", {
        method: "POST",
        body: JSON.stringify({ url: uploaded.secure_url, publicId: uploaded.public_id }),
      });

      onChange({ url: verified.url, publicId: verified.publicId, alt: value?.alt ?? "" });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    const publicId = value?.publicId;
    onChange(null);
    if (publicId) {
      try {
        await api("/admin/uploads/delete", { method: "POST", body: JSON.stringify({ publicId }) });
      } catch {
        // The post no longer references it; a leftover asset is harmless.
      }
    }
  }

  return (
    <div className="a-stack">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="a-cover" src={value.url} alt={value.alt || "Cover preview"} />
      ) : null}

      <label className={`a-upload ${value ? "" : "a-upload-empty"} ${uploading ? "is-busy" : ""}`} aria-busy={uploading}>
        <input type="file" accept={ALLOWED.join(",")} onChange={onFile} disabled={uploading} aria-label="Upload cover image" />
        {uploading ? <span className="a-spinner a-spinner-dark" aria-hidden="true" /> : <Icon name="image" size={value ? 20 : 24} />}
        <strong>{uploading ? "Uploading…" : value ? "Replace cover" : "Upload cover image"}</strong>
        <span>JPEG, PNG, WebP or AVIF · max 8 MB</span>
      </label>

      {value ? (
        <div className="a-field">
          <label htmlFor="cover-alt">
            Alt text <span className="a-req">*</span>
          </label>
          <input
            id="cover-alt"
            className="a-input"
            value={value.alt}
            onChange={(event) => onChange({ ...value, alt: event.target.value })}
            maxLength={500}
            placeholder="Describe the image for screen readers"
          />
          <div>
            <button className="a-btn a-btn-outline a-btn-sm" type="button" onClick={remove}>
              <Icon name="trash" size={15} />
              Remove image
            </button>
          </div>
        </div>
      ) : null}

      {uploading ? (
        <p className="a-muted" aria-live="polite">
          Uploading to Cloudinary…
        </p>
      ) : null}
      {error ? (
        <div className="a-banner a-banner-error" role="alert">
          <Icon name="alert-circle" size={18} />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}
