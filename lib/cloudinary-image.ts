// trailingSlash is enabled in next.config.ts, so the canonical proxy URL includes the slash.
export const IMAGE_PROXY_PATH = "/img/";

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

/** Rewrites a Cloudinary delivery URL to the same-origin proxy; other sources pass through. */
export function cloudinaryProxyUrl(src: string, width: number): string {
  if (!src.includes(CLOUDINARY_HOST) || !src.includes(UPLOAD_SEGMENT)) return src;
  return `${IMAGE_PROXY_PATH}?u=${encodeURIComponent(src)}&w=${width}`;
}

/**
 * Validates a proxy request and rebuilds a deterministic Cloudinary URL.
 * Returns null for anything that is not an https image in the configured cloud.
 */
export function resolveCloudinaryTarget(raw: string, width: number, cloud: string): URL | null {
  if (!cloud || !isAllowedWidth(width)) return null;

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
  const [first, ...tail] = rest.split("/");
  if (!first) return null;

  // Keep the version segment, replace any existing transformation segment.
  const remainder = /^v\d+$/.test(first) ? rest : tail.join("/");
  if (!remainder) return null;

  return new URL(`https://${CLOUDINARY_HOST}/${cloud}${UPLOAD_SEGMENT}f_webp,q_auto,w_${width}/${remainder}`);
}
