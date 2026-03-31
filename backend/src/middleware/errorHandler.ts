import { NextFunction, Request, Response } from "express";
import { createResponse } from "../utils/api";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json(createResponse(false, null, "Route not found", "NOT_FOUND"));
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res
    .status(500)
    .json(createResponse(false, null, "An unexpected error occurred", error.message));
};
