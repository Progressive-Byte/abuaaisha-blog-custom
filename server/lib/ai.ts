import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { sourceSchema } from "../../lib/post-schema";

export const aiRequestSchema = z.object({
  topic: z.string().trim().min(5, "Topic needs a little more detail").max(2000),
  audience: z.string().trim().max(300).optional().or(z.literal("")),
  language: z.enum(["bn", "en"]).default("bn"),
  tone: z.string().trim().max(100).optional().or(z.literal("")),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  keywords: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.enum(["faith", "social", "worldview"]).default("social"),
});

export type AiRequest = z.infer<typeof aiRequestSchema>;

const draftSchema = z.object({
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().min(1).max(1000),
  description: z.string().trim().max(2000).default(""),
  body: z.string().trim().min(200),
  sources: z.array(sourceSchema).max(30).default([]),
});

export type AiDraft = z.infer<typeof draftSchema>;

const WORDS = { short: 700, medium: 1200, long: 2000 } as const;
const MAX_TOKENS = { short: 1600, medium: 2600, long: 4000 } as const;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    body: { type: "string" },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, url: { type: "string" } },
        required: ["title", "url"],
      },
    },
  },
  required: ["title", "summary", "description", "body", "sources"],
};

function buildPrompt(input: AiRequest): string {
  return [
    `Topic: ${input.topic}`,
    `Category: ${input.category}`,
    input.audience ? `Target audience: ${input.audience}` : "",
    `Language: ${input.language === "bn" ? "Bengali (Bangla)" : "English"}`,
    input.tone ? `Tone: ${input.tone}` : "",
    input.keywords ? `Keywords to include naturally: ${input.keywords}` : "",
    `Length: about ${WORDS[input.length]} words`,
    "Return JSON matching the requested schema. The body must be Markdown only: paragraphs, ## subheadings, lists and > quotes. No HTML, no H1, no images.",
    input.language === "bn"
      ? "সব উদ্ধৃতি, আয়াত বা হাদীসের জন্য sources-এ নির্ভরযোগ্য https লিংক দিন। নিশ্চিত না হলে উদ্ধৃতি দেবেন না—লিংক বানিয়ে দেবেন না।"
      : "For every quote or citation, include a reliable https source. If unsure, omit the quotation rather than inventing a link.",
  ]
    .filter(Boolean)
    .join("\n");
}

const SYSTEM = `You are a careful draft writer for the "Abu Aaisha" blog: a practicing Muslim writing warmly and personally about faith, family, parenting, society and worldview. Write original prose in the requested language. Never publish; a human editor reviews and edits everything.`;

function parseJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  return JSON.parse(trimmed);
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("AI request timed out")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const GEMINI_FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

async function generateGemini(input: AiRequest): Promise<{ raw: unknown; usage: unknown }> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI_API_KEY is not set");
  const baseUrl = process.env.AI_BASE_URL;
  const ai = new GoogleGenAI({ apiKey, ...(baseUrl ? { httpOptions: { baseUrl } } : {}) });

  const configured = process.env.AI_MODEL?.trim();
  const models = [...new Set([configured, ...GEMINI_FALLBACK_MODELS].filter((m): m is string => Boolean(m)))];
  const deadline = Date.now() + 55_000;
  let lastError: unknown;

  for (const model of models) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) break;
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: buildPrompt(input),
          config: {
            systemInstruction: SYSTEM,
            responseMimeType: "application/json",
            responseJsonSchema: RESPONSE_SCHEMA,
            temperature: 0.7,
            maxOutputTokens: MAX_TOKENS[input.length],
          },
        }),
        Math.min(40_000, remaining),
      );
      return {
        raw: parseJson(response.text ?? ""),
        usage: { model, tokens: response.usageMetadata ?? null },
      };
    } catch (error) {
      lastError = error;
      const message = String((error as Error).message ?? "");
      // Retry a different model only for availability/rate/transient failures.
      if (!/no longer available|not found|UNAVAILABLE|high demand|timed out|timeout|503|404|429/i.test(message)) {
        throw error;
      }
      console.error(`[ai] model ${model} failed, trying next: ${message.slice(0, 180)}`);
    }
  }

  throw lastError ?? new Error("AI generation failed");
}

async function generateOpenAi(input: AiRequest): Promise<{ raw: unknown; usage: unknown }> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI_API_KEY is not set");
  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: MAX_TOKENS[input.length],
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildPrompt(input) },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`AI provider returned ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
    }

    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: unknown;
    };
    const content = body.choices?.[0]?.message?.content ?? "";
    return { raw: parseJson(content), usage: { model, usage: body.usage ?? null } };
  } finally {
    clearTimeout(timer);
  }
}

export async function generateDraft(input: AiRequest): Promise<{ draft: AiDraft; usage: unknown }> {
  const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  const result = provider === "openai" ? await generateOpenAi(input) : await generateGemini(input);
  const parsed = draftSchema.safeParse(result.raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`AI output failed validation: ${issues}`);
  }
  if (!parsed.data.sources.length) parsed.data.sources = [];
  return { draft: parsed.data, usage: result.usage };
}
