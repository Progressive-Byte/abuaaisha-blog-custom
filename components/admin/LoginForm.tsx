"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api-client";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="a-banner a-banner-error" role="alert">
          <Icon name="alert-circle" size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="a-field">
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          className="a-input"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="a-field">
        <label htmlFor="admin-password">Password</label>
        <div className="a-input-wrap">
          <input
            id="admin-password"
            className="a-input"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="a-input-action"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
          </button>
        </div>
      </div>

      <button className="a-btn" type="submit" disabled={loading}>
        {loading ? <span className="a-spinner" aria-hidden="true" /> : null}
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
