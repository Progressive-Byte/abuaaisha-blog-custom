import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDb } from "../../lib/db";
import { AdminCredentialModel } from "./models/models";

const KEY = "admin";

export const PASSWORD_RESET_TTL_MINUTES = 30;
const RESET_TTL_MS = PASSWORD_RESET_TTL_MINUTES * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** The credential row is created lazily on the first change/reset. */
async function findCredential() {
  if (!process.env.MONGODB_URI) return null;
  try {
    await connectDb();
    return await AdminCredentialModel.findOne({ key: KEY });
  } catch (error) {
    console.error("[admin] could not read credential", error);
    return null;
  }
}

export async function getEffectivePasswordHash(): Promise<string | null> {
  const credential = await findCredential();
  return credential?.passwordHash ?? process.env.ADMIN_PASSWORD_HASH ?? null;
}

export async function getAdminSessionVersion(): Promise<number> {
  const credential = await findCredential();
  return credential?.sessionVersion ?? 0;
}

export async function validateAdminPassword(password: string): Promise<boolean> {
  const hash = await getEffectivePasswordHash();
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Stores a new bcrypt hash and bumps the session version, so every existing
 * session token becomes invalid. Returns the new version.
 */
export async function setAdminPassword(passwordHash: string): Promise<number> {
  await connectDb();
  const email = process.env.ADMIN_EMAIL ?? "";
  const credential = await AdminCredentialModel.findOneAndUpdate(
    { key: KEY },
    {
      $set: { email, passwordHash, resetTokenHash: null, resetExpiresAt: null },
      $inc: { sessionVersion: 1 },
    },
    { upsert: true, new: true },
  );
  return credential?.sessionVersion ?? 1;
}

async function ensureCredential(): Promise<boolean> {
  await connectDb();
  const existing = await AdminCredentialModel.exists({ key: KEY });
  if (existing) return true;
  const email = process.env.ADMIN_EMAIL;
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !envHash) return false;
  await AdminCredentialModel.updateOne(
    { key: KEY },
    { $setOnInsert: { key: KEY, email, passwordHash: envHash, sessionVersion: 0 } },
    { upsert: true },
  );
  return true;
}

/** Creates a single-use reset token and returns the raw token (only the hash is stored). */
export async function createPasswordResetToken(): Promise<string | null> {
  try {
    if (!(await ensureCredential())) return null;
    const token = crypto.randomBytes(32).toString("base64url");
    await AdminCredentialModel.updateOne(
      { key: KEY },
      {
        $set: {
          resetTokenHash: hashToken(token),
          resetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      },
    );
    return token;
  } catch (error) {
    console.error("[admin] could not create reset token", error);
    return null;
  }
}

export async function resetPasswordWithToken(token: string, passwordHash: string): Promise<boolean> {
  await connectDb();
  const consumed = await AdminCredentialModel.findOneAndUpdate(
    {
      key: KEY,
      resetTokenHash: hashToken(token),
      resetExpiresAt: { $gt: new Date() },
    },
    { $set: { resetTokenHash: null, resetExpiresAt: null } },
    { new: true },
  );
  if (!consumed) return false;
  await setAdminPassword(passwordHash);
  return true;
}
