import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.cloudinary.com",
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    loaderFile: "./lib/cloudinary-loader.ts",
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async redirects() {
    return [
      { source: "/posts/page/1", destination: "/posts/", permanent: true },
      { source: "/posts/page/4", destination: "/posts/page/3/", permanent: true },
      { source: "/categories", destination: "/posts/", permanent: true },
      { source: "/categories/index.xml", destination: "/index.xml", permanent: true },
      { source: "/pages", destination: "/about/", permanent: true },
      { source: "/pages/index.xml", destination: "/index.xml", permanent: true },
      { source: "/pages/about", destination: "/about/", permanent: true },
      { source: "/admin/ai", destination: "/admin/posts/new?ai=1", permanent: false },
    ];
  },
  async rewrites() {
    // In `next dev`, the Express API runs separately; in production it is the
    // Next.js API route at pages/api/[...path].ts, so no rewrite is needed.
    if (isProd) return [];
    const target = process.env.API_DEV_URL ?? "http://localhost:3001";
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
    ];

    return [
      { source: "/:path*", headers },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
