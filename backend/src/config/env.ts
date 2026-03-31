import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@feedpulse.local",
  adminPassword: process.env.ADMIN_PASSWORD ?? "feedpulse-admin",
  emailFrom: process.env.EMAIL_FROM ?? "no-reply@feedpulse.local",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? process.env.EMAIL_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? process.env.EMAIL_PASSWORD ?? ""
};

const required = ["mongoUri", "jwtSecret"] as const;

for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
