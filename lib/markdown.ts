import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

const schema = {
  ...defaultSchema,
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "id", "className"],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    img: [...(defaultSchema.attributes?.img ?? []), "loading", "decoding"],
    input: [...(defaultSchema.attributes?.input ?? []), "type", "checked", "disabled"],
  },
};

export interface Heading {
  id: string;
  text: string;
  depth: number;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const re = /<h([2-3]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    headings.push({
      depth: Number(match[1]),
      id: match[2],
      text: decodeEntities(match[3].replace(/<[^>]*>/g, "")).trim(),
    });
  }
  return headings;
}

export async function renderMarkdown(markdown: string): Promise<{ html: string; headings: Heading[] }> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(markdown);

  const html = String(file);
  return { html, headings: extractHeadings(html) };
}

/** Raw HTML is never returned from post bodies. */
export function sanitizeMarkdownInput(markdown: string): string {
  return markdown
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\]\(\s*javascript:[^)]*\)/gi, "](#)")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
