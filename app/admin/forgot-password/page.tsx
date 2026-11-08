import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/admin/ForgotPasswordForm";
import { Icon } from "@/components/Icon";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
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
            Forgot password
          </h1>
          <p className="a-subtitle">We&apos;ll email a one-time reset link to the admin address.</p>
        </div>

        <ForgotPasswordForm />

        <div className="a-login-foot">
          <Icon name="lock" size={14} />
          <Link href="/admin/login/">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
