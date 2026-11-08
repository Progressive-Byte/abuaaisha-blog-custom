import dotenv from "dotenv";

// .env.local wins over .env (dotenv does not overwrite existing keys).
dotenv.config({ path: ".env.local" });
dotenv.config();
