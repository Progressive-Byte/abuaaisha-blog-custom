import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login/");

  return (
    <div className="a-shell">
      <AdminNav email={session.email} />
      <main className="a-main">{children}</main>
    </div>
  );
}
