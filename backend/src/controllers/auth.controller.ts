import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { createResponse } from "../utils/api";
import { sanitizeEmail, sanitizeText } from "../utils/sanitize";

export const loginAdmin = (req: Request, res: Response) => {
  const email = sanitizeEmail(req.body.email);
  const password = sanitizeText(req.body.password);

  if (email !== env.adminEmail || password !== env.adminPassword) {
    res.status(401).json(createResponse(false, null, "Invalid admin credentials", "UNAUTHORIZED"));
    return;
  }

  const token = jwt.sign({ email, role: "admin" }, env.jwtSecret, { expiresIn: "12h" });

  res.status(200).json(
    createResponse(
      true,
      {
        token,
        admin: { email }
      },
      "Login successful"
    )
  );
};
