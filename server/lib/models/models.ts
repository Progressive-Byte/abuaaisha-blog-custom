import mongoose, { type Model } from "mongoose";
import type { Category, Language, PostStatus } from "../../../lib/post-schema";

const { Schema } = mongoose;

export interface PostDocument {
  slug: string;
  title: string;
  summary: string;
  description?: string;
  body: string;
  categories: Category[];
  lang: Language;
  status: PostStatus;
  publishedAt: Date;
  image?: { url: string; publicId?: string; alt: string };
  aiGenerated?: boolean;
  sources?: { title: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    alt: { type: String, required: true },
  },
  { _id: false },
);

const sourceSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const postSchema = new Schema<PostDocument>(
  {
    slug: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true },
    description: { type: String },
    body: { type: String, required: true },
    categories: {
      type: [String],
      enum: ["faith", "social", "worldview"],
      required: true,
    },
    lang: { type: String, enum: ["bn", "en"], default: "bn" },
    status: { type: String, enum: ["draft", "published"], default: "draft", required: true },
    publishedAt: { type: Date, required: true },
    image: { type: imageSchema },
    aiGenerated: { type: Boolean },
    sources: { type: [sourceSchema] },
  },
  { timestamps: true, versionKey: false },
);

postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ categories: 1, status: 1, publishedAt: -1 });
postSchema.index(
  { title: "text", summary: "text", body: "text" },
  { weights: { title: 5, summary: 2, body: 1 }, name: "post_search" },
);

export const PostModel: Model<PostDocument> =
  (mongoose.models.Post as Model<PostDocument> | undefined) ?? mongoose.model<PostDocument>("Post", postSchema);

export interface ContactMessageDocument {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  ipHash?: string;
  emailStatus: "sent" | "stored" | "failed";
  createdAt: Date;
}

const contactMessageSchema = new Schema<ContactMessageDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    ipHash: { type: String },
    emailStatus: { type: String, enum: ["sent", "stored", "failed"], default: "stored" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export const ContactMessageModel: Model<ContactMessageDocument> =
  (mongoose.models.ContactMessage as Model<ContactMessageDocument> | undefined) ??
  mongoose.model<ContactMessageDocument>("ContactMessage", contactMessageSchema);

export interface AdminCredentialDocument {
  key: string;
  email: string;
  passwordHash: string;
  sessionVersion: number;
  resetTokenHash?: string | null;
  resetExpiresAt?: Date | null;
  updatedAt: Date;
}

const adminCredentialSchema = new Schema<AdminCredentialDocument>(
  {
    key: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    sessionVersion: { type: Number, default: 0 },
    resetTokenHash: { type: String },
    resetExpiresAt: { type: Date },
  },
  { timestamps: { createdAt: false, updatedAt: true }, versionKey: false },
);

export const AdminCredentialModel: Model<AdminCredentialDocument> =
  (mongoose.models.AdminCredential as Model<AdminCredentialDocument> | undefined) ??
  mongoose.model<AdminCredentialDocument>("AdminCredential", adminCredentialSchema);

export interface RateLimitDocument {
  key: string;
  count: number;
  resetAt: Date;
}

const rateLimitSchema = new Schema<RateLimitDocument>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    resetAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitModel: Model<RateLimitDocument> =
  (mongoose.models.RateLimit as Model<RateLimitDocument> | undefined) ??
  mongoose.model<RateLimitDocument>("RateLimit", rateLimitSchema);
