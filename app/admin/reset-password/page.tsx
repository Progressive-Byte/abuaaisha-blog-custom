import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";
import { Icon } from "@/components/Icon";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

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
            Set a new password
          </h1>
          <p className="a-subtitle">
            {token
              ? "Choose a new password for the admin panel. The link can only be used once."
              : "This reset link is incomplete or has expired."}
          </p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="a-banner a-banner-error" role="alert">
            <Icon name="alert-circle" size={18} />
            <span>Request a fresh reset link from the sign-in page.</span>
          </div>
        )}

        <div className="a-login-foot">
          <Icon name="lock" size={14} />
          <Link href="/admin/forgot-password/">Request a new link</Link>
        </div>
      </div>
    </main>
  );
}
