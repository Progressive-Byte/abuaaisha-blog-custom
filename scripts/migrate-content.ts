import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import matter from "gray-matter";
import { v2 as cloudinary } from "cloudinary";
import { connectDb } from "../lib/db";
import { PostModel, ContactMessageModel, RateLimitModel } from "../server/lib/models/models";
import { postSchema } from "../lib/post-schema";

dotenv.config({ path: ".env.local" });
dotenv.config();

const root = path.resolve(process.cwd());
const postsDir = path.join(root, "content", "legacy", "posts");
const publicDir = path.join(root, "public");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryReady = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryReady) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

async function uploadCover(slug: string, localPath: string): Promise<{ url: string; publicId?: string } | null> {
  if (!cloudinaryReady) return null;
  const publicId = `abuaaisha/posts/${slug}`;

  try {
    const existing = await cloudinary.api.resource(publicId, { resource_type: "image" });
    return { url: existing.secure_url as string, publicId };
  } catch {
    // Not uploaded yet.
  }

  const result = await cloudinary.uploader.upload(localPath, {
    folder: "abuaaisha/posts",
    public_id: slug,
    overwrite: false,
    resource_type: "image",
    transformation: [{ width: 1600, crop: "limit" }],
    quality: "auto",
    fetch_format: "auto",
  });
  return { url: result.secure_url as string, publicId: result.public_id as string };
}

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is required.");
    process.exit(1);
  }
  if (!cloudinaryReady) {
    console.warn("Cloudinary credentials are missing — existing image URLs will be kept unchanged.");
  }

  await connectDb();
  await Promise.all([PostModel.syncIndexes(), ContactMessageModel.syncIndexes(), RateLimitModel.syncIndexes()]);

  const files = (await fs.readdir(postsDir)).filter((file) => file.endsWith(".md")).sort();
  const counters = { inserted: 0, updated: 0, uploaded: 0, skipped: 0, failed: 0 };

  for (const file of files) {
    const slug = path.basename(file, ".md");
    const raw = await fs.readFile(path.join(postsDir, file), "utf8");
    const parsed = matter(raw);
    const result = postSchema.safeParse(parsed.data);

    if (!result.success) {
      counters.failed++;
      console.error(`✗ ${file}: ${result.error.issues.map((issue) => issue.message).join("; ")}`);
      continue;
    }

    const data = result.data;
    let image: { url: string; publicId?: string; alt: string } | undefined;

    if (data.image) {
      const alt = data.imageAlt?.trim() ?? "";
      if (data.image.startsWith("/images/")) {
        const localPath = path.join(publicDir, data.image.replace(/^\//, ""));
        try {
          const uploaded = await uploadCover(slug, localPath);
          if (uploaded) {
            image = { ...uploaded, alt };
            counters.uploaded++;
          } else {
            image = { url: data.image, alt };
          }
        } catch (error) {
          counters.failed++;
          console.error(`✗ ${file}: image upload failed → ${(error as Error).message}`);
          image = { url: data.image, alt };
        }
      } else {
        image = { url: data.image, alt };
      }
    }

    const doc = {
      slug,
      title: data.title,
      summary: data.summary,
      description: data.description,
      body: parsed.content.trim(),
      categories: data.categories,
      lang: data.lang,
      status: data.draft ? "draft" : "published",
      publishedAt: data.date,
      image,
      aiGenerated: data.aiGenerated,
      sources: data.sources?.length ? data.sources : undefined,
    };

    const exists = await PostModel.exists({ slug });
    await PostModel.updateOne({ slug }, { $set: doc }, { upsert: true });
    if (exists) counters.updated++;
    else counters.inserted++;
    console.log(`${exists ? "↻" : "+"} ${slug}${image?.publicId ? " (cloudinary)" : ""}`);
  }

  console.log(
    `\nMigration complete: ${counters.inserted} inserted, ${counters.updated} updated, ` +
      `${counters.uploaded} images uploaded to Cloudinary, ${counters.failed} failed.`,
  );

  if (counters.failed > 0) process.exitCode = 1;
}

run()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
