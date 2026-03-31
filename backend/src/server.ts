import { app } from "./app";
import { connectToDatabase } from "./config/db";
import { env } from "./config/env";

const start = async () => {
  await connectToDatabase();
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
