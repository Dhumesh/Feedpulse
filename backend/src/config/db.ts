import mongoose from "mongoose";
import { env } from "./env";

export const connectToDatabase = async () => {
  const maxAttempts = 10;
  const retryDelayMs = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri);
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      console.warn(
        `MongoDB connection attempt ${attempt} failed. Retrying in ${retryDelayMs}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
};
