import type { IncomingMessage, ServerResponse } from "node:http";
import serverless from "serverless-http";
import { app } from "../server/app";

export const config = { maxDuration: 60 };

export default serverless(app) as unknown as (req: IncomingMessage, res: ServerResponse) => void;
