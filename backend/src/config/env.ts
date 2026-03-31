import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@feedpulse.local",
  adminPassword: process.env.ADMIN_PASSWORD ?? "feedpulse-admin"
};

const required = ["mongoUri", "jwtSecret"] as const;

for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
