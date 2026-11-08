const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/** Ask the Next.js app to drop its cached public pages. Best-effort. */
export async function revalidatePublicPages(): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;

  try {
    await fetch(`${siteUrl()}/revalidate/?secret=${encodeURIComponent(secret)}`, {
      method: "POST",
      cache: "no-store",
    });
  } catch (error) {
    console.error("[revalidate] failed", error);
  }
}
