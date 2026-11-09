import { describe, expect, it } from "vitest";
import {
  IMAGE_PLACEHOLDER,
  cloudinaryProxyUrl,
  isAllowedWidth,
  pathFromCloudinaryUrl,
  resolveCloudinaryTarget,
} from "../lib/cloudinary-image";

const CLOUD = "wvuewdd5";
const RAW = "https://res.cloudinary.com/wvuewdd5/image/upload/v1794207152/abuaaisha/posts/cover.jpg";
const PATH = "v1794207152/abuaaisha/posts/cover.jpg";

describe("cloudinaryProxyUrl", () => {
  it("routes only the asset path through the same-origin proxy", () => {
    const proxied = cloudinaryProxyUrl(RAW, 640);
    expect(proxied).toBe(`/img/?p=${encodeURIComponent(PATH)}&w=640`);
    expect(proxied).not.toContain("cloudinary.com");
  });

  it("passes local and non-Cloudinary sources through", () => {
    expect(cloudinaryProxyUrl("/images/site/post-placeholder.webp", 640)).toBe("/images/site/post-placeholder.webp");
    expect(cloudinaryProxyUrl("https://example.com/a.jpg", 640)).toBe("https://example.com/a.jpg");
  });

  it("falls back to the placeholder for a malformed Cloudinary URL", () => {
    expect(cloudinaryProxyUrl("https://res.cloudinary.com/wvuewdd5/image/upload/", 640)).toBe(IMAGE_PLACEHOLDER);
  });
});

describe("pathFromCloudinaryUrl", () => {
  it("extracts the versioned path and drops transformations", () => {
    expect(pathFromCloudinaryUrl(RAW, CLOUD)).toBe(PATH);
    expect(
      pathFromCloudinaryUrl(
        "https://res.cloudinary.com/wvuewdd5/image/upload/f_auto,q_auto,w_3840/v1794207152/abuaaisha/posts/cover.jpg",
        CLOUD,
      ),
    ).toBe(PATH);
  });

  it("rejects other hosts, protocols, clouds and credentials", () => {
    expect(pathFromCloudinaryUrl("https://example.com/x.jpg", CLOUD)).toBeNull();
    expect(pathFromCloudinaryUrl("http://res.cloudinary.com/wvuewdd5/image/upload/v1/x.jpg", CLOUD)).toBeNull();
    expect(pathFromCloudinaryUrl(RAW.replace(CLOUD, "someoneelse"), CLOUD)).toBeNull();
    expect(
      pathFromCloudinaryUrl("https://user:pass@res.cloudinary.com/wvuewdd5/image/upload/v1/x.jpg", CLOUD),
    ).toBeNull();
  });
});

describe("resolveCloudinaryTarget", () => {
  it("builds a webp transformation before the version segment", () => {
    expect(resolveCloudinaryTarget(PATH, 640, CLOUD)?.toString()).toBe(
      "https://res.cloudinary.com/wvuewdd5/image/upload/f_webp,q_auto,w_640/v1794207152/abuaaisha/posts/cover.jpg",
    );
  });

  it("rejects paths that could escape the fixed cloud URL", () => {
    expect(resolveCloudinaryTarget("/v1/x.jpg", 640, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget("v1/../x.jpg", 640, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget("v1//x.jpg", 640, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget("https://evil.com/x.jpg", 640, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget("v1/x.jpg?q=1", 640, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget("v1/x.jpg#frag", 640, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget("", 640, CLOUD)).toBeNull();
  });

  it("rejects disallowed widths and a missing cloud", () => {
    expect(resolveCloudinaryTarget(PATH, 999, CLOUD)).toBeNull();
    expect(resolveCloudinaryTarget(PATH, 640, "")).toBeNull();
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
