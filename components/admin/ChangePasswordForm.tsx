"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "saving") return;

    if (newPassword !== confirm) {
      setState("error");
      setMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 10) {
      setState("error");
      setMessage("Password must be at least 10 characters.");
      return;
    }

    setState("saving");
    setMessage("");
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setState("success");
      setMessage("Password updated. All other sessions have been signed out.");
      toast.success("Password updated.");
    } catch (error) {
      const reason = error instanceof ApiError ? error.message : "Could not update the password.";
      setState("error");
      setMessage(reason);
      toast.error(reason);
    }
  }

  return (
    <form className="a-stack a-form-narrow" onSubmit={onSubmit}>
      <div className="a-field">
        <label htmlFor="current-password">Current password</label>
        <input
          id="current-password"
          className="a-input"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>

      <div className="a-field">
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          className="a-input"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={10}
          required
        />
        <small>At least 10 characters.</small>
      </div>

      <div className="a-field">
        <label htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          className="a-input"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          minLength={10}
          required
        />
      </div>

      <div className="a-row">
        <button className="a-btn" type="submit" disabled={state === "saving"}>
          {state === "saving" ? <span className="a-spinner" aria-hidden="true" /> : null}
          {state === "saving" ? "Updating…" : "Update password"}
        </button>
      </div>

      {message ? (
        <div
          className={`a-banner ${state === "error" ? "a-banner-error" : "a-banner-success"}`}
          role={state === "error" ? "alert" : "status"}
        >
          <Icon name={state === "error" ? "alert-circle" : "check-circle"} size={18} />
          <span>{message}</span>
        </div>
      ) : null}
    </form>
  );
}
