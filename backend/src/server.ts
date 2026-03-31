import { app } from "./app";
import { connectToDatabase } from "./config/db";
import { env } from "./config/env";
import { ensureAdminUser } from "./services/user.service";

const start = async () => {
  await connectToDatabase();
  await ensureAdminUser();
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
