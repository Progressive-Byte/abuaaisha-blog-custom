import type { NextApiRequest, NextApiResponse } from "next";
import { app } from "../../server/app";

/**
 * Next.js API route (Pages Router) that mounts the Express app.
 *
 * A root-level /api folder is only picked up by Vercel for non-framework
 * projects. For a Next.js project, the function must live in pages/api or
 * app/api. Next's Node request/response objects are compatible with Express,
 * so the app can be used directly (no Lambda event wrapper).
 */
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return (app as unknown as (request: NextApiRequest, response: NextApiResponse) => void)(req, res);
}
