import { NextFunction, Request, Response } from "express";
import { createResponse } from "../utils/api";

const requests = new Map<string, number[]>();
const limit = 5;
const windowMs = 60 * 60 * 1000;

export const feedbackRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const recent = (requests.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    res
      .status(429)
      .json(createResponse(false, null, "Too many submissions from this IP", "RATE_LIMITED"));
    return;
  }

  recent.push(now);
  requests.set(key, recent);
  next();
};
