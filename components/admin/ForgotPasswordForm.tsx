"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");
    try {
      await api("/auth/forgot", { method: "POST", body: JSON.stringify({ email }) });
      setState("sent");
      setMessage("If that address matches the admin account, a reset link has been sent. It expires in 30 minutes.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof ApiError ? error.message : "Could not send the reset email.");
    }
  }

  if (state === "sent") {
    return (
      <div className="a-stack">
        <div className="a-banner a-banner-success" role="status">
          <Icon name="check-circle" size={18} />
          <span>{message}</span>
        </div>
        <p className="a-muted">Check the inbox for the admin email address, including spam.</p>
        <Link className="a-btn a-btn-outline" href="/admin/login/">
          Back to sign in
        </Link>
      </div>
    );
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
        <label htmlFor="forgot-email">Admin email</label>
        <input
          id="forgot-email"
          className="a-input"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
        />
        <small>A one-time reset link will be emailed to this address.</small>
      </div>

      <button className="a-btn" type="submit" disabled={state === "sending"}>
        {state === "sending" ? <span className="a-spinner" aria-hidden="true" /> : null}
        {state === "sending" ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
