import type { Metadata } from "next";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="a-stack">
      <header className="a-page-head">
        <div>
          <AdminBackLink href="/admin/" label="Back to dashboard" />
          <h1 className="a-title">Account</h1>
          <p className="a-subtitle">Change the password you use to sign in to the admin panel.</p>
        </div>
      </header>

      <section className="a-card">
        <ChangePasswordForm />
      </section>
    </div>
  );
}
