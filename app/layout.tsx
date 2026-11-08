import type { Metadata, Viewport } from "next";
import "@fontsource/anek-bangla/400.css";
import "@fontsource/anek-bangla/500.css";
import "@fontsource/anek-bangla/600.css";
import "@fontsource/anek-bangla/700.css";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.tagline} | ${SITE.nameEn}`,
    template: `%s | ${SITE.nameEn}`,
  },
  description: SITE.description,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/index.xml" },
  },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: SITE.nameEn,
    title: SITE.name,
    description: SITE.description,
    url: SITE_URL,
    images: [{ url: SITE.ogImage }],
    locale: "bn_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
    images: [SITE.ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1730",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" data-scroll-behavior="smooth">
      <body id="top">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
