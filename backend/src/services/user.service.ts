import { env } from "../config/env";
import { User } from "../models/User";
import { hashPassword } from "../utils/password";

export const ensureAdminUser = async () => {
  const existingAdmin = await User.findOne({ email: env.adminEmail });
  const passwordHash = await hashPassword(env.adminPassword);

  if (existingAdmin) {
    existingAdmin.passwordHash = passwordHash;
    existingAdmin.name = "FeedPulse Admin";
    existingAdmin.role = "admin";
    existingAdmin.isVerified = true;
    existingAdmin.verificationToken = undefined;
    existingAdmin.verificationEmailError = undefined;
    await existingAdmin.save();
    return existingAdmin;
  }

  return User.create({
    email: env.adminEmail,
    passwordHash,
    name: "FeedPulse Admin",
    role: "admin",
    isVerified: true
  });
};
