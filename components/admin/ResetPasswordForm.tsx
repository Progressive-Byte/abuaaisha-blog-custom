"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "saving") return;

    if (password !== confirm) {
      setState("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 10) {
      setState("error");
      setMessage("Password must be at least 10 characters.");
      return;
    }

    setState("saving");
    setMessage("");
    try {
      await api("/auth/reset", { method: "POST", body: JSON.stringify({ token, password }) });
      router.replace("/admin/login/?reset=1");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof ApiError ? error.message : "Could not reset the password.");
    }
  }

  return (
    <form className="a-stack" onSubmit={onSubmit}>
      {state === "error" ? (
        <div className="a-banner a-banner-error" role="alert">
          <Icon name="alert-circle" size={18} />
          <span>{message}</span>
        </div>
      ) : null}

      <div className="a-field">
        <label htmlFor="reset-password">New password</label>
        <input
          id="reset-password"
          className="a-input"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={10}
          required
          autoFocus
        />
        <small>At least 10 characters.</small>
      </div>

      <div className="a-field">
        <label htmlFor="reset-confirm">Confirm new password</label>
        <input
          id="reset-confirm"
          className="a-input"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          minLength={10}
          required
        />
      </div>

      <button className="a-btn" type="submit" disabled={state === "saving"}>
        {state === "saving" ? <span className="a-spinner" aria-hidden="true" /> : null}
        {state === "saving" ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
