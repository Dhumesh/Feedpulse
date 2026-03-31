import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";

const createResponseDouble = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn()
  };

  response.status.mockReturnValue(response);

  return response;
};

describe("requireAuth", () => {
  it("rejects requests without a bearer token", () => {
    const req = { headers: {} } as Request;
    const res = createResponseDouble();
    const next = jest.fn() as NextFunction;

    requireAuth(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: "UNAUTHORIZED",
      message: "Authentication required"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows admin requests with a valid token", () => {
    const token = jwt.sign({ id: "admin-1", email: "admin@example.com", role: "admin" }, env.jwtSecret);
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    } as Request;
    const res = createResponseDouble();
    const next = jest.fn() as NextFunction;

    requireAuth(req as never, res as never, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
