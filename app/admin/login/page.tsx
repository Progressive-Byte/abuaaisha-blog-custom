import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Icon } from "@/components/Icon";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { getAdminSessionVersion } from "@/server/lib/admin";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (session && session.version === (await getAdminSessionVersion())) redirect("/admin/");

  const { next, reset } = await searchParams;

  return (
    <main className="a-login">
      <div className="a-login-card">
        <div className="a-login-brand">
          <span className="a-brand-mark">
            <Icon name="star" size={20} />
          </span>
          <div>
            <strong>{SITE.name}</strong>
            <small>Admin panel</small>
          </div>
        </div>
        <div>
          <h1 className="a-title" style={{ fontSize: "1.4rem" }}>
            Sign in
          </h1>
          <p className="a-subtitle">Sign in with the admin account for this site.</p>
        </div>

        {reset === "1" ? (
          <div className="a-banner a-banner-success" role="status">
            <Icon name="check-circle" size={18} />
            <span>Password updated. Sign in with your new password.</span>
          </div>
        ) : null}

        <LoginForm next={next} />

        <p className="a-login-help">
          <Link href="/admin/forgot-password/">Forgot your password?</Link>
        </p>

        <div className="a-login-foot">
          <Icon name="lock" size={14} />
          Protected area — admin access only
        </div>
      </div>
    </main>
  );
}
