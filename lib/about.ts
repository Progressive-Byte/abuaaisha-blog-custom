import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown } from "./markdown";

export interface AboutPage {
  title: string;
  description?: string;
  body: string;
  html: string;
}

export async function getAboutPage(): Promise<AboutPage> {
  const file = path.join(process.cwd(), "content", "about.md");
  const raw = await fs.readFile(file, "utf8");
  const parsed = matter(raw);
  const { html } = await renderMarkdown(parsed.content);
  return {
    title: String(parsed.data.title ?? "পরিচিতি"),
    description: parsed.data.description ? String(parsed.data.description) : undefined,
    body: parsed.content,
    html,
  };
}
