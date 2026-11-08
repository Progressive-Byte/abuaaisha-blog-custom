import express, { type NextFunction, type Request, type Response } from "express";
import { HttpError } from "./lib/http";
import { checkOrigin } from "./lib/auth";
import { authRoutes } from "./routes/auth";
import { postRoutes } from "./routes/posts";
import { aiRoutes } from "./routes/ai";
import { uploadRoutes } from "./routes/uploads";
import { contactRoutes } from "./routes/contact";
import { searchRoutes } from "./routes/search";
import { connectDb } from "../lib/db";
import { PostModel } from "./lib/models/models";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", checkOrigin, authRoutes);
app.use("/api/admin", checkOrigin, postRoutes);
app.use("/api/admin", checkOrigin, aiRoutes);
app.use("/api/admin", checkOrigin, uploadRoutes);
app.use("/api", searchRoutes);
app.use("/api", contactRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = error instanceof HttpError ? error.status : (error as { status?: number }).status ?? 500;
  const expected = error instanceof HttpError || (error as { expected?: boolean }).expected === true;
  // In development, surface the real cause (e.g. a missing env var) instead of the generic message.
  const isDev = process.env.NODE_ENV !== "production";
  const message =
    status < 500 || expected || isDev
      ? ((error as Error).message ?? "Request failed")
      : "Something went wrong. Please try again.";

  if (status >= 500) console.error("[api] error", error);
  res.status(typeof status === "number" ? status : 500).json({ error: message });
});

// Warm the connection and build indexes once per cold start (best effort).
void connectDb()
  .then(() => PostModel.init())
  .catch((error) => console.error("[db] init failed", error));
