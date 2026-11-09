import { isAllowedWidth, resolveCloudinaryTarget } from "@/lib/cloudinary-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLACEHOLDER = "/images/site/post-placeholder.webp";
const CACHE_CONTROL = "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400, immutable";

function placeholderRedirect(request: Request): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: new URL(PLACEHOLDER, request.url).toString(),
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const raw = url.searchParams.get("u");
  const width = Number(url.searchParams.get("w"));

  if (!raw || !isAllowedWidth(width)) {
    return new Response("Bad request", { status: 400 });
  }

  const target = resolveCloudinaryTarget(raw, width, process.env.CLOUDINARY_CLOUD_NAME ?? "");
  if (!target) {
    return new Response("Forbidden", { status: 403 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: { Accept: "image/webp,image/*;q=0.8" },
      signal: controller.signal,
    });
  } catch {
    return placeholderRedirect(request);
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok || !upstream.body) {
    return placeholderRedirect(request);
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("Content-Type") ?? "image/webp",
    "Cache-Control": CACHE_CONTROL,
    "X-Content-Type-Options": "nosniff",
  });

  const etag = upstream.headers.get("ETag");
  if (etag) headers.set("ETag", etag);

  return new Response(upstream.body, { status: 200, headers });
}
