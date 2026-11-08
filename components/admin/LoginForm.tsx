"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api-client";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.replace(next && next.startsWith("/admin") ? next : "/admin/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <form className="a-stack" onSubmit={onSubmit}>
      {error ? (
        <p className="a-banner a-banner-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="a-field">
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          className="a-input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="a-field">
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          className="a-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <button className="a-btn" type="submit" disabled={loading}>
        {loading ? <span className="a-spinner" aria-hidden="true" /> : null}
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
