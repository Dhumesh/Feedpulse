import crypto from "crypto";
import nodemailer from "nodemailer";
import { env } from "../config/env";
import { UserDocument } from "../models/User";

const hasSmtpConfig = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const getTransporter = () =>
  nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

export const createVerificationToken = () => crypto.randomBytes(24).toString("hex");

export const sendVerificationEmail = async (user: UserDocument) => {
  const verificationUrl = `${env.frontendUrl}/auth?token=${user.verificationToken ?? ""}`;
  const fromAddress = env.emailFrom || env.smtpUser;

  if (!hasSmtpConfig()) {
    console.log(`Email delivery not configured. Verification link for ${user.email}: ${verificationUrl}`);
    return;
  }

  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: user.email,
      subject: "Verify your FeedPulse account",
      text: `Verify your FeedPulse account by opening this link: ${verificationUrl}`,
      html: `<p>Verify your FeedPulse account by clicking the link below.</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`
    });
    console.log(`Verification email sent to ${user.email}`);
    return { sent: true as const, error: null };
  } catch (error) {
    console.error("Verification email send failed:", error);
    console.log(`Manual verification link for ${user.email}: ${verificationUrl}`);
    return {
      sent: false as const,
      error: error instanceof Error ? error.message : "EMAIL_SEND_FAILED"
    };
  }
};
