import { revalidatePath } from "next/cache";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function secretMatches(provided: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !provided) return false;
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (!secretMatches(secret)) return unauthorized();

  revalidatePath("/", "layout");
  return Response.json({ revalidated: true, now: Date.now() });
}

export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (!secretMatches(secret)) return unauthorized();
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true, now: Date.now() });
}
