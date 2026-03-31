import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { createResponse } from "../utils/api";

type AuthPayload = {
  email: string;
  role: "admin" | "user";
};

export type AuthenticatedRequest = Request & {
  user?: AuthPayload;
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json(createResponse(false, null, "Authentication required", "UNAUTHORIZED"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    if (payload.role !== "admin") {
      res.status(401).json(createResponse(false, null, "Admin access required", "UNAUTHORIZED"));
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json(createResponse(false, null, "Invalid or expired token", "UNAUTHORIZED"));
  }
};
