export interface AdminPostImage {
  url: string;
  publicId?: string;
  alt: string;
}

export interface AdminPostSource {
  title: string;
  url: string;
}

export type PostStatus = "draft" | "published";
export type AdminCategory = "faith" | "social" | "worldview";

export interface AdminPostSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categories: AdminCategory[];
  lang: "bn" | "en";
  status: PostStatus;
  publishedAt: string;
  image: AdminPostImage | null;
  updatedAt: string;
}

export interface AdminPost extends AdminPostSummary {
  description: string;
  body: string;
  aiGenerated: boolean;
  sources: AdminPostSource[];
  createdAt: string;
}

export interface PostsResponse {
  posts: AdminPostSummary[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface StatsResponse {
  total: number;
  published: number;
  drafts: number;
  recent: AdminPostSummary[];
}

export interface AiDraft {
  title: string;
  summary: string;
  description: string;
  body: string;
  sources: AdminPostSource[];
}
