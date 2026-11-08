import { v2 as cloudinary } from "cloudinary";

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw Object.assign(new Error("Cloudinary is not configured"), { status: 503, expected: true });
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName, apiKey, apiSecret };
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  transformation: string;
  allowedFormats: string;
}

export function signUpload(folder = "abuaaisha/posts"): UploadSignature {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const transformation = "c_limit,w_1600,q_auto,f_auto";
  const allowedFormats = "jpg,jpeg,png,webp,avif";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, transformation, allowed_formats: allowedFormats },
    apiSecret,
  );
  return { cloudName, apiKey, timestamp, signature, folder, transformation, allowedFormats };
}

export function verifyAsset(url: string, publicId?: string): { url: string; publicId?: string } {
  const { cloudName } = config();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw Object.assign(new Error("Invalid image URL"), { status: 400, expected: true });
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") {
    throw Object.assign(new Error("Image must be hosted on Cloudinary"), { status: 400, expected: true });
  }
  if (!parsed.pathname.startsWith(`/${cloudName}/image/upload/`)) {
    throw Object.assign(new Error("Image belongs to a different Cloudinary account"), { status: 400, expected: true });
  }

  return { url, publicId };
}

export async function destroyAsset(publicId: string): Promise<void> {
  if (!publicId.startsWith("abuaaisha/")) return;
  try {
    config();
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.error("[cloudinary] delete failed", error);
  }
}
