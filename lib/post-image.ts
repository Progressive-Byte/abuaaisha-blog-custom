import fs from "node:fs";
import path from "node:path";
import type { PostImage } from "./types";

/**
 * Returns the image only when it is usable. Local /images/... paths whose file
 * is missing are treated as "no image" so the shared placeholder is shown
 * instead of a broken thumbnail. Cloudinary URLs pass through unchanged.
 */
export function usableImage(image?: PostImage | null): PostImage | undefined {
  if (!image?.url) return undefined;

  if (image.url.startsWith("/")) {
    const relative = image.url.split(/[?#]/)[0].replace(/^\/+/, "");
    try {
      if (!fs.existsSync(path.join(process.cwd(), "public", relative))) return undefined;
    } catch {
      return undefined;
    }
  }

  return image;
}
