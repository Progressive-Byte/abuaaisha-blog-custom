import type { Category, Language, PostStatus } from "./post-schema";

export interface PostImage {
  url: string;
  publicId?: string;
  alt: string;
}

export interface PostSource {
  title: string;
  url: string;
}

export interface PostRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  body: string;
  categories: Category[];
  lang: Language;
  status: PostStatus;
  publishedAt: Date;
  image?: PostImage;
  aiGenerated?: boolean;
  sources?: PostSource[];
  createdAt: Date;
  updatedAt: Date;
}

export type Post = PostRecord;
