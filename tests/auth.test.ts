import { beforeAll, describe, expect, it } from "vitest";
import { signSession, verifySession } from "../lib/auth";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-value-at-least-32-characters-long";
});

describe("session", () => {
  it("signs and verifies a session", async () => {
    const token = await signSession("owner@example.com");
    await expect(verifySession(token)).resolves.toEqual({ email: "owner@example.com", version: 0 });
  });

  it("carries the session version", async () => {
    const token = await signSession("owner@example.com", 4);
    await expect(verifySession(token)).resolves.toEqual({ email: "owner@example.com", version: 4 });
  });

  it("rejects a tampered token", async () => {
    const token = await signSession("owner@example.com");
    await expect(verifySession(`${token}x`)).resolves.toBeNull();
  });

  it("rejects an empty token", async () => {
    await expect(verifySession(undefined)).resolves.toBeNull();
  });
});
