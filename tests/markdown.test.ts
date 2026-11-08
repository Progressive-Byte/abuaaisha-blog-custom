import { describe, expect, it } from "vitest";
import { renderMarkdown, sanitizeMarkdownInput } from "../lib/markdown";
import { readingMinutes } from "../lib/format";

describe("renderMarkdown", () => {
  it("renders headings with stable ids", async () => {
    const { html, headings } = await renderMarkdown("## প্রথম অংশ\n\nবাংলা লেখা।");
    expect(html).toContain('<h2 id="প্রথম-অংশ">');
    expect(headings[0]).toMatchObject({ depth: 2, id: "প্রথম-অংশ", text: "প্রথম অংশ" });
  });

  it("strips raw HTML and scripts", async () => {
    const { html } = await renderMarkdown("Hello <script>alert(1)</script> <img src=x onerror=alert(1)>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
  });

  it("keeps links and lists", async () => {
    const { html } = await renderMarkdown("- one\n- two\n\n[link](https://example.com)");
    expect(html).toContain("<ul>");
    expect(html).toContain('href="https://example.com"');
  });
});

describe("sanitizeMarkdownInput", () => {
  it("removes javascript links", () => {
    expect(sanitizeMarkdownInput("[x](javascript:alert(1))")).not.toContain("javascript:");
  });
});

describe("readingMinutes", () => {
  it("always returns at least one minute", () => {
    expect(readingMinutes("short")).toBe(1);
  });
});
