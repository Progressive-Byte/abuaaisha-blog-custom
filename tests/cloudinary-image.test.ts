import { describe, expect, it } from "vitest";
import { cloudinaryProxyUrl, isAllowedWidth, resolveCloudinaryTarget } from "../lib/cloudinary-image";

const CLOUD = "wvuewdd5";
const RAW = "https://res.cloudinary.com/wvuewdd5/image/upload/v1794207152/abuaaisha/posts/cover.jpg";

describe("cloudinaryProxyUrl", () => {
  it("routes Cloudinary images through the same-origin proxy", () => {
    expect(cloudinaryProxyUrl(RAW, 640)).toBe(`/img/?u=${encodeURIComponent(RAW)}&w=640`);
  });

  it("passes local and non-Cloudinary sources through", () => {
    expect(cloudinaryProxyUrl("/images/site/post-placeholder.webp", 640)).toBe("/images/site/post-placeholder.webp");
    expect(cloudinaryProxyUrl("https://example.com/a.jpg", 640)).toBe("https://example.com/a.jpg");
  });
});

describe("resolveCloudinaryTarget", () => {
  it("builds a webp transformation before the version segment", () => {
    expect(resolveCloudinaryTarget(RAW, 640, CLOUD)?.toString()).toBe(
      "https://res.cloudinary.com/wvuewdd5/image/upload/f_webp,q_auto,w_640/v1794207152/abuaaisha/posts/cover.jpg",
    );
  });

  it("replaces an existing transformation segment", () => {
    const src = "https://res.cloudinary.com/wvuewdd5/image/upload/f_auto,q_auto,w_3840/v1794207152/abuaaisha/posts/cover.jpg";
    expect(resolveCloudinaryTarget(src, 1200, CLOUD)?.toString()).toBe(
      "https://res.cloudinary.com/wvuewdd5/image/upload/f_webp,q_auto,w_1200/v1794207152/abuaaisha/posts/cover.jpg",
    );
  });

  it("rejects other hosts, protocols, clouds and paths", () => {
    expect(resolveCloudinaryTarget("https://example.com/x.jpg", 640, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget("http://res.cloudinary.com/wvuewdd5/image/upload/v1/x.jpg", 640, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget(RAW.replace(CLOUD, "someoneelse"), 640, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget("https://res.cloudinary.com/wvuewdd5/video/upload/v1/x.mp4", 640, CLOUD)).toBeNull();
  });

  it("rejects credentials in the URL", () => {
    expect(resolveCloudinaryTarget("https://user:pass@res.cloudinary.com/wvuewdd5/image/upload/v1/x.jpg", 640, CLOUD)).toBeNull();
  });

  it("rejects disallowed widths and a missing cloud", () => {
    expect(resolveCloudinaryTarget(RAW, 999, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget(RAW, 640, "")).toBeNull();
  });
});

describe("isAllowedWidth", () => {
  it("allows only widths Next.js can request", () => {
    expect(isAllowedWidth(640)).toBe(true);
    expect(isAllowedWidth(2048)).toBe(true);
    expect(isAllowedWidth(999)).toBe(false);
    expect(isAllowedWidth(3.5)).toBe(false);
  });
});
