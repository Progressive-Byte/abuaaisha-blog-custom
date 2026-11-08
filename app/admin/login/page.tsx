import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Icon } from "@/components/Icon";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (session) redirect("/admin/");

  const { next } = await searchParams;

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
          <p className="a-subtitle">Use the admin account configured in your environment variables.</p>
        </div>
        <LoginForm next={next} />
        <div className="a-login-foot">
          <Icon name="lock" size={14} />
          Protected area — admin access only
        </div>
      </div>
    </main>
  );
}
