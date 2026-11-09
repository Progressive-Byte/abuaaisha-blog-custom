// trailingSlash is enabled in next.config.ts, so the canonical proxy URL includes the slash.
export const IMAGE_PROXY_PATH = "/img/";
export const IMAGE_PLACEHOLDER = "/images/site/post-placeholder.webp";

const CLOUDINARY_HOST = "res.cloudinary.com";
const UPLOAD_SEGMENT = "/image/upload/";

// Mirrors next.config.ts images.deviceSizes plus next/image's default imageSizes.
const IMAGE_WIDTHS = new Set([
  16, 32, 48, 64, 96, 128, 256, 384,
  640, 750, 828, 1080, 1170, 1200, 1920, 2048,
]);

export function isAllowedWidth(width: number): boolean {
  return Number.isInteger(width) && IMAGE_WIDTHS.has(width);
}

/** Versioned asset path after /image/upload/, with any transformation segment removed. */
function assetPathFrom(src: string): string | null {
  let source: URL;
  try {
    source = new URL(src);
  } catch {
    return null;
  }

  if (source.protocol !== "https:" || source.hostname !== CLOUDINARY_HOST) return null;

  const uploadIndex = source.pathname.indexOf(UPLOAD_SEGMENT);
  if (uploadIndex === -1) return null;

  const rest = source.pathname.slice(uploadIndex + UPLOAD_SEGMENT.length);
  if (!rest) return null;

  const [first, ...tail] = rest.split("/");
  const path = /^v\d+$/.test(first) ? rest : tail.join("/");
  return path || null;
}

/**
 * Rewrites a Cloudinary delivery URL to the same-origin proxy; other sources pass through.
 * Only the asset path is sent to the browser, so no Cloudinary hostname appears in the URL.
 */
export function cloudinaryProxyUrl(src: string, width: number): string {
  if (!src.includes(CLOUDINARY_HOST) || !src.includes(UPLOAD_SEGMENT)) return src;

  const path = assetPathFrom(src);
  if (!path) return IMAGE_PLACEHOLDER;

  return `${IMAGE_PROXY_PATH}?p=${encodeURIComponent(path)}&w=${width}`;
}

/** Extracts the asset path from a legacy full-URL proxy request. */
export function pathFromCloudinaryUrl(raw: string, cloud: string): string | null {
  if (!cloud) return null;

  let source: URL;
  try {
    source = new URL(raw);
  } catch {
    return null;
  }

  if (source.protocol !== "https:" || source.hostname !== CLOUDINARY_HOST) return null;
  if (source.username || source.password) return null;

  const prefix = `/${cloud}${UPLOAD_SEGMENT}`;
  if (!source.pathname.startsWith(prefix)) return null;

  const rest = source.pathname.slice(prefix.length);
  if (!rest) return null;

  const [first, ...tail] = rest.split("/");
  return /^v\d+$/.test(first) ? rest : tail.join("/") || null;
}

/** Builds a deterministic Cloudinary delivery URL from a validated asset path. */
export function resolveCloudinaryTarget(path: string, width: number, cloud: string): URL | null {
  if (!cloud || !isAllowedWidth(width)) return null;
  if (!path || path.startsWith("/")) return null;
  if (/[\\?#]/.test(path) || path.includes("//") || path.includes("..") || path.includes(":")) return null;

  const segments = path.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;

  return new URL(`https://${CLOUDINARY_HOST}/${cloud}${UPLOAD_SEGMENT}f_webp,q_auto,w_${width}/${path}`);
}
