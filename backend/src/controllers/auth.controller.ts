import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { createVerificationToken, sendVerificationEmail } from "../services/email.service";
import { createResponse } from "../utils/api";
import { sanitizeEmail, sanitizeText } from "../utils/sanitize";
import { hashPassword, verifyPassword } from "../utils/password";

export const registerUser = async (req: Request, res: Response) => {
  const name = sanitizeText(req.body.name);
  const email = sanitizeEmail(req.body.email);
  const password = sanitizeText(req.body.password);

  if (!name || !email || password.length < 6) {
    res
      .status(400)
      .json(createResponse(false, null, "Name, email, and a 6+ character password are required", "VALIDATION_ERROR"));
    return;
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(409).json(createResponse(false, null, "User already exists", "CONFLICT"));
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "user",
    isVerified: false,
    verificationToken: createVerificationToken()
  });

  const emailResult = await sendVerificationEmail(user);

  if (emailResult.sent) {
    user.verificationEmailSentAt = new Date();
    user.verificationEmailError = undefined;
  } else {
    user.verificationEmailError = emailResult.error;
  }

  await user.save();

  res.status(201).json(
    createResponse(
      true,
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verificationEmailSentAt: user.verificationEmailSentAt ?? null,
        verificationEmailError: user.verificationEmailError ?? null
      },
      emailResult.sent
        ? "Registered successfully. Check your email to verify your account."
        : "Registered successfully, but email sending failed. User is still stored in MongoDB."
    )
  );
};

export const loginUser = async (req: Request, res: Response) => {
  const email = sanitizeEmail(req.body.email);
  const password = sanitizeText(req.body.password);

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401).json(createResponse(false, null, "Invalid credentials", "UNAUTHORIZED"));
    return;
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    res.status(401).json(createResponse(false, null, "Invalid credentials", "UNAUTHORIZED"));
    return;
  }

  if (!user.isVerified) {
    res
      .status(403)
      .json(createResponse(false, null, "Verify your email before logging in", "EMAIL_NOT_VERIFIED"));
    return;
  }

  const token = jwt.sign({ email: user.email, role: user.role }, env.jwtSecret, { expiresIn: "12h" });

  res.status(200).json(
    createResponse(
      true,
      {
        token,
        user: {
          email: user.email,
          name: user.name,
          role: user.role
        }
      },
      "Login successful"
    )
  );
};

export const verifyUserEmail = async (req: Request, res: Response) => {
  const token = sanitizeText(req.query.token);

  if (!token) {
    res.status(400).json(createResponse(false, null, "Verification token is required", "VALIDATION_ERROR"));
    return;
  }

  const user = await User.findOneAndUpdate(
    { verificationToken: token },
    { isVerified: true, verificationToken: undefined },
    { new: true }
  );

  if (!user) {
    res.status(404).json(createResponse(false, null, "Invalid or expired verification link", "NOT_FOUND"));
    return;
  }

  res.status(200).json(
    createResponse(
      true,
      {
        email: user.email,
        isVerified: user.isVerified
      },
      "Email verified successfully"
    )
  );
};
